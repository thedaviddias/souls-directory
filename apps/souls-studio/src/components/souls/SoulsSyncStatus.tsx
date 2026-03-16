import { Cloud, CloudOff, Github, HardDrive, Loader2, LogOut, RefreshCw } from 'lucide-react'
import type { SyncStatus } from '../../types/soul'

interface SoulsSyncStatusProps {
  status: SyncStatus
  isAuthenticated: boolean
  onSyncNow: () => void
  onSignIn: () => void
  onSignOut: () => Promise<void>
  userLabel: string
}

function statusLabel(status: SyncStatus) {
  if (status.state === 'syncing') return 'Syncing'
  if (status.state === 'offline') return 'Offline'
  if (status.state === 'error') return 'Sync error'
  return 'Up to date'
}

function userInitials(label: string) {
  const parts = label.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return label.slice(0, 2).toUpperCase()
}

export function SoulsSyncStatus({
  status,
  isAuthenticated,
  onSyncNow,
  onSignIn,
  onSignOut,
  userLabel,
}: SoulsSyncStatusProps) {
  if (!isAuthenticated) {
    return (
      <div className="h-10 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <HardDrive className="w-4 h-4 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Local only — sign in to sync with souls.directory
          </p>
        </div>
        <button
          onClick={onSignIn}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center gap-1.5 transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          Sign in with GitHub
        </button>
      </div>
    )
  }

  return (
    <div className="h-10 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {status.state === 'offline' ? (
          <CloudOff className="w-4 h-4 text-[var(--text-muted)]" />
        ) : status.state === 'syncing' ? (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
        ) : (
          <Cloud className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-primary)] font-medium">
            {statusLabel(status)} · {status.pendingCount} pending
          </p>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {status.lastSyncAt
              ? `Last sync ${new Date(status.lastSyncAt).toLocaleTimeString()}`
              : 'No sync completed yet'}
            {status.cappedByLimit ? ' · Remote list capped at 50' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 hidden sm:flex">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-white leading-none">
              {userInitials(userLabel)}
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">{userLabel}</span>
        </div>
        <button
          onClick={onSyncNow}
          disabled={status.state === 'syncing'}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync now
        </button>
        <button
          onClick={() => void onSignOut()}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-1.5"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
