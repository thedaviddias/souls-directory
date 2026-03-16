import { useVirtualizer } from '@tanstack/react-virtual'
import { FileText, Plus, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import type { LocalSoul } from '../../types/soul'

interface SoulsSidebarProps {
  souls: LocalSoul[]
  selectedSoulId: string | null
  onSelectSoul: (localSoulId: string) => void
  onCreateSoul: () => void
}

function syncBadgeClass(syncState: LocalSoul['syncState']) {
  if (syncState === 'synced') return 'bg-emerald-500/15 text-emerald-500'
  if (syncState === 'error') return 'bg-red-500/15 text-red-500'
  return 'bg-amber-500/15 text-amber-500'
}

export function SoulsSidebar({
  souls,
  selectedSoulId,
  onSelectSoul,
  onCreateSoul,
}: SoulsSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: souls.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div className="h-full border-r border-[var(--border)] bg-[var(--bg-secondary)] sidebar-source-list flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">My Souls</h3>
        <button
          onClick={onCreateSoul}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] flex items-center gap-1 btn-press"
          aria-label="Create new soul"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          New
        </button>
      </div>

      {souls.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div className="animate-fade-in-up">
            <div className="empty-state-icon">
              <Sparkles />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No souls yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Create your first soul to define how AI agents should behave.
            </p>
            <button
              onClick={onCreateSoul}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] btn-press"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Create Soul
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2"
          role="listbox"
          aria-label="My souls list"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const soul = souls[virtualItem.index]
              const isSelected = selectedSoulId === soul.localId
              return (
                <button
                  key={soul.localId}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelectSoul(soul.localId)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <FileText
                          className="w-3.5 h-3.5 text-[var(--text-muted)]"
                          aria-hidden="true"
                        />
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {soul.name || 'Untitled Soul'}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)] truncate">
                        /{soul.slug || 'missing-slug'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${syncBadgeClass(soul.syncState)}`}
                    >
                      {soul.syncState}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
