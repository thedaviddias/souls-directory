import { toSoulDisplayRepo } from '../lib/repo-display'
import type { Soul } from '../types/soul'

interface SoulCardProps {
  soul: Soul
  onClick: () => void
}

export function SoulCard({ soul, onClick }: SoulCardProps) {
  const displayRepo = toSoulDisplayRepo(soul.owner, soul.repo)

  return (
    <button
      onClick={onClick}
      className="interactive-card w-full text-left p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl cursor-pointer
                 hover:border-[var(--accent)] transition-all duration-200"
      aria-label={`${soul.name} from ${displayRepo}${soul.isInstalled ? ' (installed)' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg text-[var(--text-primary)]">{soul.name}</h3>
        <div className="flex gap-1">
          {soul.isInstalled && (
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full"
              style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
            >
              Installed
            </span>
          )}
          {!soul.isFetched && (
            <span className="px-2 py-0.5 text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-full">
              Not fetched
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-1">{displayRepo}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-2">{soul.description}</p>
    </button>
  )
}
