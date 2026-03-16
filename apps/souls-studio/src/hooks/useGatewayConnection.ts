import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { GatewayAgent, GatewayConnectionStatus, OpenClawConnection } from '../types/soul'

const HEARTBEAT_INTERVAL = 30_000
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]
const MAX_RETRIES = 5

export function useGatewayConnection(connections: OpenClawConnection[]) {
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)
  const [status, setStatus] = useState<GatewayConnectionStatus>('disconnected')
  const [agents, setAgents] = useState<GatewayAgent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sshPidRef = useRef<number | null>(null)
  const intentionalCloseRef = useRef(false)
  const lastUrlRef = useRef<string | null>(null)
  const lastConnectionIdRef = useRef<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscribersRef = useRef<Set<(msg: any) => void>>(new Set())

  const activeConnection = connections.find((c) => c.id === activeConnectionId) ?? null

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setNextRetryIn(null)
  }, [])

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    clearCountdown()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [clearCountdown])

  const cleanupSshTunnel = useCallback(async () => {
    if (sshPidRef.current && isTauriRuntime()) {
      try {
        await invoke('stop_ssh_tunnel', { pid: sshPidRef.current })
      } catch {
        // ignore
      }
      sshPidRef.current = null
    }
  }, [])

  const requestAgents = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'list_agents' }))
    }
  }, [])

  const startCountdown = useCallback((delayMs: number) => {
    let remaining = Math.ceil(delayMs / 1000)
    setNextRetryIn(remaining)
    countdownRef.current = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(countdownRef.current!)
        countdownRef.current = null
        setNextRetryIn(null)
      } else {
        setNextRetryIn(remaining)
      }
    }, 1000)
  }, [])

  const connectToUrl = useCallback(
    (url: string, connectionId: string) => {
      cleanup()
      setStatus('connecting')
      setError(null)
      setReconnecting(false)
      intentionalCloseRef.current = false
      lastUrlRef.current = url
      lastConnectionIdRef.current = connectionId

      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setStatus('connected')
          setError(null)
          setReconnecting(false)
          setRetryCount(0)
          reconnectAttemptRef.current = 0

          heartbeatRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }))
            }
          }, HEARTBEAT_INTERVAL)

          requestAgents()
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'agents_list' && Array.isArray(msg.agents)) {
              setAgents(msg.agents)
            }
            // Forward all messages to subscribers
            subscribersRef.current.forEach((handler) => handler(msg))
          } catch {
            // Ignore non-JSON messages
          }
        }

        ws.onerror = () => {
          setError('Connection error')
        }

        ws.onclose = () => {
          cleanup()
          if (!intentionalCloseRef.current) {
            const attempt = reconnectAttemptRef.current

            if (attempt >= MAX_RETRIES) {
              // Give up
              setStatus('error')
              setError(`Connection failed after ${MAX_RETRIES} attempts`)
              setReconnecting(false)
              setRetryCount(attempt)
              return
            }

            setStatus('error')
            setReconnecting(true)
            reconnectAttemptRef.current = attempt + 1
            setRetryCount(attempt + 1)

            const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]
            startCountdown(delay)

            reconnectTimerRef.current = setTimeout(() => {
              if (!intentionalCloseRef.current) {
                connectToUrl(url, connectionId)
              }
            }, delay)
          } else {
            setStatus('disconnected')
          }
        }
      } catch {
        setStatus('error')
        setError('Failed to create WebSocket connection')
      }
    },
    [cleanup, requestAgents, startCountdown]
  )

  const connect = useCallback(
    async (connectionId: string) => {
      const conn = connections.find((c) => c.id === connectionId)
      if (!conn) return

      setActiveConnectionId(connectionId)
      setAgents([])
      setRetryCount(0)
      reconnectAttemptRef.current = 0

      if (conn.method === 'ssh' && conn.sshHost && conn.sshUser && isTauriRuntime()) {
        setStatus('connecting')
        try {
          const result = await invoke<{ pid: number; localPort: number }>('start_ssh_tunnel', {
            sshHost: conn.sshHost,
            sshUser: conn.sshUser,
            sshPort: conn.sshPort || 22,
            sshKeyPath: conn.sshKeyPath || null,
            sshPassphrase: conn.sshPassphrase || null,
            sshPassword: conn.sshPassword || null,
            remotePort: 18789,
          })
          sshPidRef.current = result.pid
          connectToUrl(`ws://127.0.0.1:${result.localPort}`, connectionId)
        } catch (e) {
          setStatus('error')
          const msg = String(e)
          setError(msg.startsWith('SSH tunnel') ? msg : `SSH tunnel failed: ${msg}`)
        }
      } else {
        connectToUrl(conn.gatewayUrl, connectionId)
      }
    },
    [connections, connectToUrl]
  )

  const disconnect = useCallback(async () => {
    intentionalCloseRef.current = true
    cleanup()
    await cleanupSshTunnel()
    setActiveConnectionId(null)
    setStatus('disconnected')
    setAgents([])
    setError(null)
    setReconnecting(false)
    setRetryCount(0)
    reconnectAttemptRef.current = 0
  }, [cleanup, cleanupSshTunnel])

  const stopRetrying = useCallback(() => {
    intentionalCloseRef.current = true
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    clearCountdown()
    setReconnecting(false)
    // Keep status as "error" and error message visible
  }, [clearCountdown])

  const retry = useCallback(() => {
    if (!lastUrlRef.current || !lastConnectionIdRef.current) return
    intentionalCloseRef.current = false
    reconnectAttemptRef.current = 0
    setRetryCount(0)
    setReconnecting(false)
    connectToUrl(lastUrlRef.current, lastConnectionIdRef.current)
  }, [connectToUrl])

  const switchConnection = useCallback(
    async (connectionId: string) => {
      await disconnect()
      await connect(connectionId)
    },
    [disconnect, connect]
  )

  const refreshAgents = useCallback(() => {
    requestAgents()
  }, [requestAgents])

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscribe = useCallback((handler: (msg: any) => void) => {
    subscribersRef.current.add(handler)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsubscribe = useCallback((handler: (msg: any) => void) => {
    subscribersRef.current.delete(handler)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true
      cleanup()
      void cleanupSshTunnel()
    }
  }, [cleanup, cleanupSshTunnel])

  return {
    activeConnectionId,
    activeConnection,
    status,
    agents,
    error,
    reconnecting,
    retryCount,
    maxRetries: MAX_RETRIES,
    nextRetryIn,
    connect,
    disconnect,
    switchConnection,
    refreshAgents,
    stopRetrying,
    retry,
    sendMessage,
    subscribe,
    unsubscribe,
  }
}
