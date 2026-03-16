import { Check, Play, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useModalAccessibility } from '../hooks/useModalAccessibility'
import { changelog } from '../lib/changelog'
import { markWhatsNewSeen } from '../lib/whats-new'

interface WhatsNewProps {
  onClose: () => void
}

function YouTubeEmbed({ videoId, version }: { videoId: string; version: string }) {
  const [playing, setPlaying] = useState(false)

  if (!playing) {
    // Show thumbnail with play button — no iframe loaded until user clicks
    return (
      <button
        onClick={() => setPlaying(true)}
        className="relative w-full group cursor-pointer"
        style={{ aspectRatio: '16 / 9' }}
        aria-label={`Play video for v${version}`}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={`Video thumbnail for v${version}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fall back to hqdefault if maxres doesn't exist
            ;(e.target as HTMLImageElement).src =
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          }}
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
            <Play className="w-6 h-6 text-gray-900 ml-0.5" />
          </div>
        </div>
      </button>
    )
  }

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
      title={`What's new in v${version}`}
      className="w-full"
      style={{ aspectRatio: '16 / 9' }}
      allow="autoplay; encrypted-media"
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
    />
  )
}

export function WhatsNew({ onClose }: WhatsNewProps) {
  const entry = changelog[0]
  const [imgError, setImgError] = useState(false)

  const handleClose = () => {
    markWhatsNewSeen()
    onClose()
  }

  const { modalRef, handleKeyDown } = useModalAccessibility(true, handleClose)

  if (!entry) return null

  const hasMedia = (entry.video || entry.image) && !imgError

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="What's New"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--border)] animate-fade-in-scale flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">What's New</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              v{entry.version}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
          {/* Video takes priority over image */}
          {entry.video && (
            <div className="px-6 pt-5">
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <YouTubeEmbed videoId={entry.video} version={entry.version} />
              </div>
            </div>
          )}

          {/* Screenshot (only if no video) */}
          {!entry.video && entry.image && !imgError && (
            <div className="px-6 pt-5">
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <img
                  src={entry.image}
                  alt={`What's new in v${entry.version}`}
                  className="w-full object-cover"
                  style={{ aspectRatio: '16 / 10' }}
                  onError={() => setImgError(true)}
                />
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className={`px-6 py-5 space-y-3 ${!hasMedia ? 'pt-5' : ''}`}>
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
              {entry.date}
            </p>
            <ul className="space-y-2.5">
              {entry.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
