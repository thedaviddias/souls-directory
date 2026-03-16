import { Check, FileText, Save, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { LocalSoul } from '../../types/soul'
import { ConfirmModal } from '../ConfirmModal'

interface SoulsDetailProps {
  soul: LocalSoul | null
  syncing: boolean
  editorFontSize?: number
  lastSavedAt?: number | null
  onChange: (localSoulId: string, patch: Partial<LocalSoul>) => void
  onSave: (localSoulId: string) => void
  onPublishNow: (localSoulId: string) => void
  onDelete: (localSoulId: string) => void
}

const inputClasses =
  'w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]'

function SaveStatus({ lastSavedAt }: { lastSavedAt?: number | null }) {
  const [, setTick] = useState(0)

  // Re-render every 10s to update relative time
  useEffect(() => {
    if (!lastSavedAt) return
    const interval = setInterval(() => setTick((t) => t + 1), 10000)
    return () => clearInterval(interval)
  }, [lastSavedAt])

  if (!lastSavedAt) return null

  const secondsAgo = Math.floor((Date.now() - lastSavedAt) / 1000)
  const label =
    secondsAgo < 5
      ? 'Saved'
      : secondsAgo < 60
        ? `Saved ${secondsAgo}s ago`
        : `Saved ${Math.floor(secondsAgo / 60)}m ago`

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
      <Check className="w-3 h-3 text-green-500" />
      {label}
    </span>
  )
}

export function SoulsDetail({
  soul,
  syncing,
  editorFontSize = 13,
  lastSavedAt,
  onChange,
  onSave,
  onPublishNow,
  onDelete,
}: SoulsDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!soul) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium text-[var(--text-primary)]">No soul selected</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[280px] mx-auto">
            Select a soul to edit, or create a new one. Changes are saved locally first, then synced
            when you publish.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] h-full">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {soul.name || 'Untitled Soul'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <SaveStatus lastSavedAt={lastSavedAt} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSave(soul.localId)}
            disabled={syncing}
            className="p-1.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            title="Save now"
            aria-label="Save draft"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPublishNow(soul.localId)}
            disabled={syncing}
            className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Save & Sync
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete soul"
            aria-label="Delete soul"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Name
            </label>
            <input
              value={soul.name}
              onChange={(event) => onChange(soul.localId, { name: event.target.value })}
              className={inputClasses}
              placeholder="Soul name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Slug
            </label>
            <input
              value={soul.slug}
              onChange={(event) =>
                onChange(soul.localId, { slug: event.target.value.toLowerCase() })
              }
              className={inputClasses}
              placeholder="soul-slug"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Tagline
          </label>
          <input
            value={soul.tagline}
            onChange={(event) => onChange(soul.localId, { tagline: event.target.value })}
            className={inputClasses}
            placeholder="Short summary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Description
          </label>
          <textarea
            value={soul.description}
            onChange={(event) => onChange(soul.localId, { description: event.target.value })}
            className={`${inputClasses} min-h-24`}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            SOUL.md Content
          </label>
          <textarea
            value={soul.content}
            onChange={(event) => onChange(soul.localId, { content: event.target.value })}
            style={{ fontSize: `${editorFontSize}px` }}
            className={`${inputClasses} min-h-[360px] font-mono leading-6`}
            placeholder="# SOUL\n\nWrite your soul content..."
          />
        </div>

        {soul.lastError && (
          <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            {soul.lastError}
          </p>
        )}
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Soul"
        message={`Delete "${soul.name || 'Untitled Soul'}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDelete(soul.localId)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
