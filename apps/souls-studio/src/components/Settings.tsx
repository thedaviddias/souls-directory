import {
  Code2,
  Info,
  Loader2,
  Minus,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Plug,
  Plus,
  Plus as PlusIcon,
  Radar,
  RefreshCw,
  Sun,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useGateway } from '../contexts/GatewayContext'
import { useModalAccessibility } from '../hooks/useModalAccessibility'
import { useSettings } from '../hooks/useSettings'
import type { OpenClawConnection, OpenClawConnectionMethod, ThemeMode } from '../types/soul'

interface SettingsProps {
  onClose: () => void
  initialPage?: SettingsPage
}

export type SettingsPage = 'general' | 'connections' | 'editor' | 'sync' | 'about'

const pages: { id: SettingsPage; label: string; icon: typeof Palette }[] = [
  { id: 'general', label: 'General', icon: Palette },
  { id: 'connections', label: 'Connections', icon: Plug },
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'about', label: 'About', icon: Info },
]

const pageTitles: Record<SettingsPage, { title: string; desc: string }> = {
  general: { title: 'General', desc: 'Appearance preferences' },
  connections: { title: 'Connections', desc: 'Manage OpenClaw Gateway connections' },
  editor: { title: 'Editor', desc: 'Customize the SOUL.md editing experience' },
  sync: { title: 'Sync', desc: 'Configure how your souls sync with the cloud' },
  about: { title: 'About', desc: 'Souls Studio version and runtime info' },
}

const labelClass = 'text-sm font-medium text-[var(--text-primary)]'
const descClass = 'text-xs text-[var(--text-muted)] mt-0.5'
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors'

const themeOptions: { value: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

const connectionMethods: { value: OpenClawConnectionMethod; label: string; desc: string }[] = [
  { value: 'local', label: 'Local', desc: 'Gateway running on this machine' },
  { value: 'ssh', label: 'SSH Tunnel', desc: 'Connect via SSH port forwarding' },
  { value: 'tailscale', label: 'Tailscale / VPN', desc: 'Gateway on a private network' },
  { value: 'direct', label: 'Direct', desc: 'Remote gateway with auth token' },
]

const syncIntervalOptions = [
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
]

// ─── General ───────────────────────────────────────────

function GeneralPage({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
}) {
  return (
    <div>
      <p className={labelClass}>Theme</p>
      <p className={descClass}>Choose light, dark, or follow your system setting</p>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {themeOptions.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl border text-xs font-medium transition-all"
              style={{
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isActive
                  ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                  : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 0 1px var(--accent)' : 'none',
              }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Connections ────────────────────────────────────────

function emptyConnection(): OpenClawConnection {
  return {
    id: crypto.randomUUID(),
    name: '',
    method: 'local',
    gatewayUrl: 'ws://127.0.0.1:18789',
  }
}

function ConnectionForm({
  connection,
  onChange,
  onSave,
  onCancel,
}: {
  connection: OpenClawConnection
  onChange: (patch: Partial<OpenClawConnection>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const method = connection.method

  const handleChange = (patch: Partial<OpenClawConnection>) => {
    if (validationError) setValidationError(null)
    onChange(patch)
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg-primary))]">
      {/* Name + Method row */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
          Connection name
        </label>
        <input
          type="text"
          value={connection.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          placeholder="e.g. My Home Server"
          className={inputClass}
          autoFocus
        />
      </div>

      {/* Method selector — single row */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
          Connection method
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {connectionMethods.map(({ value, label }) => {
            const isActive = method === value
            return (
              <button
                key={value}
                onClick={() => {
                  const patch: Partial<OpenClawConnection> = { method: value }
                  if (value === 'local') patch.gatewayUrl = 'ws://127.0.0.1:18789'
                  else if (value === 'ssh') patch.gatewayUrl = 'ws://127.0.0.1:18789'
                  else if (value === 'tailscale') patch.gatewayUrl = ''
                  else if (value === 'direct') patch.gatewayUrl = ''
                  handleChange(patch)
                }}
                className="text-center py-2 px-1 rounded-lg border text-xs font-medium transition-all"
                style={{
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Gateway URL */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
          Gateway URL
        </label>
        <input
          type="text"
          value={connection.gatewayUrl}
          onChange={(e) => handleChange({ gatewayUrl: e.target.value })}
          placeholder={method === 'local' ? 'ws://127.0.0.1:18789' : 'ws://your-host:18789'}
          className={inputClass}
        />
      </div>

      {/* SSH fields */}
      {method === 'ssh' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                SSH Host
              </label>
              <input
                type="text"
                value={connection.sshHost || ''}
                onChange={(e) => handleChange({ sshHost: e.target.value })}
                placeholder="192.168.1.100"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                SSH User
              </label>
              <input
                type="text"
                value={connection.sshUser || ''}
                onChange={(e) => handleChange({ sshUser: e.target.value })}
                placeholder="ubuntu"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                SSH Port
              </label>
              <input
                type="number"
                value={connection.sshPort || 22}
                onChange={(e) => handleChange({ sshPort: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
                SSH Key Path
              </label>
              <input
                type="text"
                value={connection.sshKeyPath || ''}
                onChange={(e) => handleChange({ sshKeyPath: e.target.value })}
                placeholder="~/.ssh/id_rsa"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              SSH Password (optional)
            </label>
            <input
              type="password"
              value={connection.sshPassword || ''}
              onChange={(e) => handleChange({ sshPassword: e.target.value })}
              placeholder="For password-based SSH auth"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
              Key Passphrase (optional)
            </label>
            <input
              type="password"
              value={connection.sshPassphrase || ''}
              onChange={(e) => handleChange({ sshPassphrase: e.target.value })}
              placeholder="Leave empty if key has no passphrase"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Auth token — for direct and tailscale */}
      {(method === 'direct' || method === 'tailscale') && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">
            Auth token (optional)
          </label>
          <input
            type="password"
            value={connection.authToken || ''}
            onChange={(e) => handleChange({ authToken: e.target.value })}
            placeholder="Bearer token for gateway auth"
            className={inputClass}
          />
        </div>
      )}

      {/* Actions */}
      {validationError && <p className="text-xs text-red-400">{validationError}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!connection.name.trim()) {
              setValidationError('Connection name is required')
              return
            }
            if (!connection.gatewayUrl.trim()) {
              setValidationError('Gateway URL is required (e.g. ws://192.168.1.100:18789)')
              return
            }
            // Auto-prepend ws:// if the user pasted a bare host/IP
            const url = connection.gatewayUrl.trim()
            if (!/^wss?:\/\//.test(url)) {
              onChange({ gatewayUrl: `ws://${url}` })
              // Let state update, then save on next tick
              setTimeout(onSave, 0)
            } else {
              onSave()
            }
            setValidationError(null)
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Save Connection
        </button>
      </div>
    </div>
  )
}

function ConnectionCard({
  connection,
  onEdit,
  onRemove,
  onSetDefault,
}: {
  connection: OpenClawConnection
  onEdit: () => void
  onRemove: () => void
  onSetDefault: () => void
}) {
  const methodLabel =
    connectionMethods.find((m) => m.value === connection.method)?.label ?? connection.method

  return (
    <div
      className="p-3.5 rounded-xl border transition-colors group"
      style={{
        borderColor: connection.isDefault ? 'var(--accent)' : 'var(--border)',
        backgroundColor: connection.isDefault
          ? 'color-mix(in srgb, var(--accent) 4%, transparent)'
          : 'transparent',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
          >
            <Plug className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {connection.name}
              </p>
              {connection.isDefault && (
                <span
                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {methodLabel} &middot; <span className="font-mono">{connection.gatewayUrl}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!connection.isDefault && (
            <button
              onClick={onSetDefault}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              title="Set as default"
            >
              <Wifi className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ConnectionsPage({
  connections,
  addConnection,
  updateConnection,
  removeConnection,
}: {
  connections: OpenClawConnection[]
  addConnection: (c: OpenClawConnection) => void
  updateConnection: (id: string, patch: Partial<OpenClawConnection>) => void
  removeConnection: (id: string) => void
}) {
  const { discovered, scanning, scanReport, rescan, dismissDiscovered, connect } = useGateway()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<OpenClawConnection | null>(null)
  const [isNew, setIsNew] = useState(false)

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
    addConnection(conn)
    dismissDiscovered(gateway.id)
    await connect(conn.id)
  }

  const startAdd = () => {
    const c = emptyConnection()
    setDraft(c)
    setEditingId(c.id)
    setIsNew(true)
  }

  const startEdit = (c: OpenClawConnection) => {
    setDraft({ ...c })
    setEditingId(c.id)
    setIsNew(false)
  }

  const handleSave = () => {
    if (!draft) return
    if (isNew) {
      addConnection(draft)
    } else {
      updateConnection(draft.id, draft)
    }
    setDraft(null)
    setEditingId(null)
    setIsNew(false)
  }

  const handleCancel = () => {
    setDraft(null)
    setEditingId(null)
    setIsNew(false)
  }

  const handleSetDefault = (id: string) => {
    connections.forEach((c) => {
      if (c.id === id) updateConnection(c.id, { isDefault: true })
      else if (c.isDefault) updateConnection(c.id, { isDefault: false })
    })
  }

  return (
    <div className="space-y-4">
      {connections.length === 0 && !editingId && (
        <div className="text-center py-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
          >
            <WifiOff className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">No connections yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[260px] mx-auto">
            Add an OpenClaw Gateway connection to deploy souls to your agents.
          </p>
        </div>
      )}

      {/* Auto-discovery section */}
      {!editingId && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
              >
                <Radar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Auto-Discovery</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] mb-3">
              Scan your network for OpenClaw gateways running locally or accessible via SSH.
            </p>
            <button
              onClick={() => void rescan()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-[13px] font-medium rounded-lg border transition-colors disabled:opacity-60"
              style={{
                backgroundColor: scanning ? 'transparent' : 'var(--accent)',
                color: scanning ? 'var(--text-secondary)' : 'white',
                borderColor: scanning ? 'var(--border)' : 'var(--accent)',
              }}
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radar className="w-4 h-4" />
              )}
              {scanning ? 'Scanning...' : 'Scan for Gateways'}
            </button>
          </div>

          {/* Discovered results */}
          {discovered.length > 0 && (
            <div className="border-t border-[var(--border)] p-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1">
                Found ({discovered.length})
              </p>
              {discovered.map((gw) => (
                <div
                  key={gw.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                >
                  <Plug className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{gw.label}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                      {gw.gatewayUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => dismissDiscovered(gw.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => void handleAcceptDiscovered(gw)}
                      className="text-xs font-semibold px-3 py-1 rounded-md transition-colors"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                      }}
                    >
                      Add & Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scanning status (no results yet) */}
          {discovered.length === 0 && scanning && (
            <div className="border-t border-[var(--border)] px-4 py-3">
              <p className="text-[13px] text-[var(--text-muted)]">
                Looking for local and SSH gateways...
              </p>
            </div>
          )}

          {/* Scan complete — no results */}
          {discovered.length === 0 && !scanning && scanReport && (
            <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
              <p className="text-[13px] text-[var(--text-secondary)]">No gateways found</p>
              <ul className="space-y-1">
                {scanReport.methods.map((m) => (
                  <li
                    key={m.method}
                    className="text-xs text-[var(--text-muted)] flex items-start gap-1.5"
                  >
                    <span className="shrink-0 mt-px">
                      {m.status === 'success' ? '✓' : m.status === 'no_config' ? '–' : '✗'}
                    </span>
                    <span>
                      {m.method === 'local' ? 'Local probe' : 'SSH config scan'}
                      {': '}
                      {m.status === 'success' && m.method === 'local' && 'no gateway on port 18789'}
                      {m.status === 'success' &&
                        m.method === 'ssh' &&
                        (m.hostsChecked === 0
                          ? 'no hosts in config'
                          : `${m.found} host${m.found === 1 ? '' : 's'} available`)}
                      {m.status === 'no_config' && (m.error || 'no config found')}
                      {m.status === 'error' && (
                        <span className="text-red-400">{m.error || 'unknown error'}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Saved connections header */}
      {connections.length > 0 && !editingId && (
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] pt-2">
          Saved Connections
        </p>
      )}

      {/* Existing connections */}
      {connections.map((c) =>
        editingId === c.id && draft ? (
          <ConnectionForm
            key={c.id}
            connection={draft}
            onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ConnectionCard
            key={c.id}
            connection={c}
            onEdit={() => startEdit(c)}
            onRemove={() => removeConnection(c.id)}
            onSetDefault={() => handleSetDefault(c.id)}
          />
        )
      )}

      {/* New connection form */}
      {isNew && draft && (
        <ConnectionForm
          connection={draft}
          onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Add button */}
      {!editingId && (
        <button
          onClick={startAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Connection
        </button>
      )}
    </div>
  )
}

// ─── Editor ────────────────────────────────────────────

function EditorPage({
  editorFontSize,
  setEditorFontSize,
}: {
  editorFontSize: number
  setEditorFontSize: (s: number) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className={labelClass}>Font size</p>
          <p className={descClass}>Adjust the editor font size for SOUL.md content</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))}
            disabled={editorFontSize <= 10}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] w-8 text-center tabular-nums">
            {editorFontSize}
          </span>
          <button
            onClick={() => setEditorFontSize(Math.min(24, editorFontSize + 1))}
            disabled={editorFontSize >= 24}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-3 font-medium">
          Preview
        </p>
        <p
          className="text-[var(--text-muted)] font-mono"
          style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
        >
          # SOUL.md
        </p>
        <p
          className="text-[var(--text-secondary)] font-mono mt-1"
          style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.6 }}
        >
          You're not a chatbot. You're a world-class executive assistant.
        </p>
      </div>
    </div>
  )
}

// ─── Sync ──────────────────────────────────────────────

function SyncPage({
  syncIntervalSeconds,
  setSyncInterval,
}: {
  syncIntervalSeconds: number
  setSyncInterval: (s: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className={labelClass}>Sync interval</p>
          <p className={descClass}>How often to sync your souls with the remote server</p>
        </div>
        <select
          value={syncIntervalSeconds}
          onChange={(e) => setSyncInterval(Number(e.target.value))}
          className="native-select px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          {syncIntervalOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── About ─────────────────────────────────────────────

function AboutPage() {
  const version = '0.1.0'
  const rows = [
    { label: 'Version', value: version },
    { label: 'Runtime', value: 'Tauri 2' },
    { label: 'Framework', value: 'React 18 + Vite' },
    { label: 'Platform', value: navigator.platform },
  ]

  const links = [
    { label: 'Website', url: 'https://souls.directory' },
    { label: 'GitHub', url: 'https://github.com/thedaviddias/souls-studio' },
    { label: 'Report Issue', url: 'https://github.com/thedaviddias/souls-studio/issues' },
  ]

  const handleLink = async (url: string) => {
    try {
      const { openExternalUrl } = await import('../lib/tauri')
      await openExternalUrl(url)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {rows.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
          >
            <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            <span className="text-sm text-[var(--text-muted)] font-mono">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {links.map(({ label, url }, i) => (
          <button
            key={label}
            onClick={() => void handleLink(url)}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left ${i < links.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
          >
            <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            <span className="text-xs text-[var(--accent)]">{url.replace('https://', '')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Settings Shell ───────────────────────────────

export function Settings({ onClose, initialPage }: SettingsProps) {
  const {
    settings,
    setTheme,
    setEditorFontSize,
    setSyncInterval,
    addConnection,
    updateConnection,
    removeConnection,
  } = useSettings()

  const [activePage, setActivePage] = useState<SettingsPage>(initialPage ?? 'general')
  const { title, desc } = pageTitles[activePage]
  const { modalRef, handleKeyDown } = useModalAccessibility(true, onClose)

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-[720px] shadow-2xl border border-[var(--border)] animate-fade-in-scale flex flex-col overflow-hidden"
        style={{ height: 'min(720px, 92vh)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <h2 id="settings-title" className="text-base font-semibold text-[var(--text-primary)]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar nav */}
          <nav className="w-48 shrink-0 border-r border-[var(--border)] bg-[var(--bg-primary)] p-3 space-y-1">
            {pages.map(({ id, label, icon: Icon }) => {
              const isActive = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => setActivePage(id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Page header */}
            <div className="px-6 pt-5 pb-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activePage === 'general' && (
                <GeneralPage theme={settings.theme} setTheme={setTheme} />
              )}
              {activePage === 'connections' && (
                <ConnectionsPage
                  connections={settings.openclawConnections}
                  addConnection={addConnection}
                  updateConnection={updateConnection}
                  removeConnection={removeConnection}
                />
              )}
              {activePage === 'editor' && (
                <EditorPage
                  editorFontSize={settings.editorFontSize}
                  setEditorFontSize={setEditorFontSize}
                />
              )}
              {activePage === 'sync' && (
                <SyncPage
                  syncIntervalSeconds={settings.syncIntervalSeconds}
                  setSyncInterval={setSyncInterval}
                />
              )}
              {activePage === 'about' && <AboutPage />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
