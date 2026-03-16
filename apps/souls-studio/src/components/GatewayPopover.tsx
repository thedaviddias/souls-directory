import {
  AlertTriangle,
  Loader2,
  Plug,
  RefreshCw,
  RotateCcw,
  Settings2,
  Square,
  WifiOff,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGateway } from '../contexts/GatewayContext'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { OpenClawConnection } from '../types/soul'

const statusDot: Record<string, string> = {
  connected: '#22c55e',
  connecting: '#eab308',
  error: '#ef4444',
  disconnected: '#6b7280',
}

interface GatewayPopoverProps {
  onClose: () => void
}

export function GatewayPopover({ onClose }: GatewayPopoverProps) {
  const {
    connections,
    activeConnectionId,
    status,
    agents,
    error,
    reconnecting,
    retryCount,
    maxRetries,
    nextRetryIn,
    connect,
    disconnect,
    discovered,
    scanning,
    rescan,
    dismissDiscovered,
    addConnection,
    stopRetrying,
    retry,
  } = useGateway()

  const [quickUrl, setQuickUrl] = useState('')
  const [pasting, setPasting] = useState(false)

  const handleQuickConnect = async () => {
    const input = quickUrl.trim()
    if (!input) return
    if (!isTauriRuntime()) return

    setPasting(true)
    try {
      const conn = await invoke<OpenClawConnection>('parse_connection_string', { input })
      await addConnection(conn)
      await connect(conn.id)
      setQuickUrl('')
    } catch (e) {
      toast.error(`Invalid connection URL: ${e instanceof Error ? e.message : 'check the format'}`)
    } finally {
      setPasting(false)
    }
  }

  const handleAcceptDiscovered = async (gateway: (typeof discovered)[0]) => {
    const conn: OpenClawConnection = {
      id: crypto.randomUUID(),
      name: gateway.label,
      method: gateway.source === 'ssh' ? 'ssh' : 'local',
      gatewayUrl: gateway.gatewayUrl,
      sshHost: gateway.sshCandidate?.hostname,
      sshUser: gateway.sshCandidate?.user,
      sshPort: gateway.sshCandidate?.port,
      sshKeyPath: gateway.sshCandidate?.identityFile,
      discovered: true,
    }
    await addConnection(conn)
    dismissDiscovered(gateway.id)
    await connect(conn.id)
  }

  return (
    <div
      className="absolute left-0 top-full mt-2 w-[300px] max-w-[calc(100vw-2rem)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden"
      style={{ animation: 'fadeInScale 0.15s ease-out' }}
    >
      {/* Connections section */}
      {connections.length > 0 && (
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Connections
          </p>
          {connections.map((conn) => {
            const isActive = conn.id === activeConnectionId
            const connStatus = isActive ? status : 'disconnected'
            return (
              <button
                key={conn.id}
                onClick={() => {
                  if (isActive) {
                    void disconnect()
                  } else {
                    void connect(conn.id)
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-[var(--bg-tertiary)]"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: statusDot[connStatus] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {conn.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                    {conn.gatewayUrl}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {isActive && status === 'connected'
                    ? 'Disconnect'
                    : isActive && status === 'connecting'
                      ? 'Connecting...'
                      : 'Connect'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Agents section (when connected) */}
      {status === 'connected' && agents.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1.5">
            Agents ({agents.length})
          </p>
          <div className="space-y-1">
            {agents.map((agent) => (
              <div
                key={agent.agentId}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)]"
              >
                <Zap className="w-3 h-3 text-[var(--accent)] shrink-0" />
                <span className="text-xs font-mono text-[var(--text-primary)] flex-1 truncate">
                  {agent.agentId}
                </span>
                <div className="flex items-center gap-1">
                  {agent.hasSoulMd && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      SOUL
                    </span>
                  )}
                  {agent.hasToolsMd && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      TOOLS
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error / Reconnection status */}
      {status === 'error' && (
        <div
          className="mx-3 mb-3 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: reconnecting
              ? 'color-mix(in srgb, #eab308 8%, var(--bg-primary))'
              : 'color-mix(in srgb, #ef4444 8%, var(--bg-primary))',
            borderColor: reconnecting
              ? 'color-mix(in srgb, #eab308 20%, var(--border))'
              : 'color-mix(in srgb, #ef4444 20%, var(--border))',
          }}
        >
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              {reconnecting ? (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {reconnecting ? 'Connection lost' : 'Connection failed'}
              </p>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] ml-[22px]">
              {reconnecting
                ? `Retrying in ${nextRetryIn ?? '...'}s (attempt ${retryCount} of ${maxRetries})`
                : (error ?? 'Could not reach gateway')}
            </p>
          </div>
          <div className="px-3 pb-2.5 flex items-center gap-2 ml-[22px]">
            {reconnecting ? (
              <>
                <button
                  onClick={stopRetrying}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Square className="w-2.5 h-2.5" />
                  Stop
                </button>
                <button
                  onClick={retry}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-white transition-colors"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Retry Now
                </button>
              </>
            ) : (
              <button
                onClick={retry}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md text-white transition-colors"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Discovered gateways */}
      {discovered.length > 0 && (
        <div className="px-3 pb-3 border-t border-[var(--border)] pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1.5">
            {scanning ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Scanning...
              </span>
            ) : (
              'Discovered'
            )}
          </p>
          {discovered.map((gw) => (
            <button
              key={gw.id}
              onClick={() => void handleAcceptDiscovered(gw)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Plug className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--text-primary)]">{gw.label}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                  {gw.gatewayUrl}
                </p>
              </div>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                Add
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && discovered.length === 0 && (
        <div className="p-6 text-center">
          <WifiOff className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-medium text-[var(--text-primary)]">No gateways found</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Paste a gateway URL below or add one in Settings.
          </p>
        </div>
      )}

      {/* Quick connect */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleQuickConnect()
            }}
            placeholder="Paste ws:// URL to connect..."
            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            disabled={pasting}
          />
          {quickUrl && (
            <button
              onClick={() => void handleQuickConnect()}
              disabled={pasting}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-white shrink-0 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {pasting ? '...' : 'Go'}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <button
          onClick={() => void rescan()}
          disabled={scanning}
          className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
          Rescan
        </button>
        <button
          onClick={() => {
            onClose()
            // Dispatch event to open settings on connections page
            window.dispatchEvent(
              new CustomEvent('souls-studio:open-settings', { detail: 'connections' })
            )
          }}
          className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          Manage
        </button>
      </div>
    </div>
  )
}
