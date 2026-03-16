import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { OpenClawConnection, SshHostCandidate } from '../types/soul'

export interface DiscoveredGateway {
  id: string
  source: 'local' | 'ssh'
  gatewayUrl: string
  label: string
  sshCandidate?: SshHostCandidate
}

export interface ScanMethodResult {
  method: 'local' | 'ssh'
  status: 'success' | 'error' | 'no_config'
  error?: string
  found?: number
  hostsChecked?: number
}

export interface ScanReport {
  completedAt: number
  methods: ScanMethodResult[]
}

export function useGatewayDiscovery(existingConnections: OpenClawConnection[]) {
  const [discovered, setDiscovered] = useState<DiscoveredGateway[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanReport, setScanReport] = useState<ScanReport | null>(null)

  const scan = useCallback(async () => {
    setScanning(true)
    setScanReport(null)

    if (!isTauriRuntime()) {
      await new Promise((r) => setTimeout(r, 1000))
      setDiscovered([])
      setScanReport({
        completedAt: Date.now(),
        methods: [
          { method: 'local', status: 'error', error: 'Not running in desktop app' },
          { method: 'ssh', status: 'error', error: 'Not running in desktop app' },
        ],
      })
      setScanning(false)
      return
    }

    const results: DiscoveredGateway[] = []
    const methods: ScanMethodResult[] = []

    // 1. Local probe
    let localFound = 0
    try {
      const localUrl = await invoke<string | null>('discover_local_gateway')
      if (localUrl) {
        localFound = 1
        const alreadyAdded = existingConnections.some((c) => c.gatewayUrl === localUrl)
        if (!alreadyAdded) {
          results.push({
            id: `local-${localUrl}`,
            source: 'local',
            gatewayUrl: localUrl,
            label: 'Local Gateway',
          })
        }
      }
      methods.push({ method: 'local', status: 'success', found: localFound })
    } catch (err) {
      methods.push({
        method: 'local',
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // 2. SSH config scan — lists hosts as candidates (no probing)
    try {
      const sshHosts = await invoke<SshHostCandidate[]>('discover_ssh_gateways')
      for (const host of sshHosts) {
        const alreadyAdded = existingConnections.some(
          (c) => c.sshHost === host.hostname || c.sshHost === host.hostAlias
        )
        if (!alreadyAdded) {
          results.push({
            id: `ssh-${host.hostAlias}`,
            source: 'ssh',
            gatewayUrl: `ws://${host.hostname}:18789`,
            label: host.hostAlias,
            sshCandidate: host,
          })
        }
      }
      methods.push({
        method: 'ssh',
        status: 'success',
        found: sshHosts.length,
        hostsChecked: sshHosts.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isNoConfig =
        message.toLowerCase().includes('no such file') ||
        message.toLowerCase().includes('not found')
      methods.push({
        method: 'ssh',
        status: isNoConfig ? 'no_config' : 'error',
        error: isNoConfig ? 'No ~/.ssh/config file found' : message,
      })
    }

    setDiscovered(results)
    setScanReport({ completedAt: Date.now(), methods })
    setScanning(false)
  }, [existingConnections])

  // Run on mount
  useEffect(() => {
    scan()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback((id: string) => {
    setDiscovered((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { discovered, scanning, scan, dismiss, scanReport }
}
