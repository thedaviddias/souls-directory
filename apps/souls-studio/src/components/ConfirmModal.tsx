import { AlertTriangle } from 'lucide-react'
import { useId } from 'react'
import { useModalAccessibility } from '../hooks/useModalAccessibility'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  open,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId()
  const descId = useId()
  const { modalRef, handleKeyDown } = useModalAccessibility(open, onCancel)

  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[60] animate-overlay flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={handleKeyDown}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div ref={modalRef} className="relative w-full max-w-sm animate-fade-in-scale">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl p-6">
          <div className="flex items-start gap-3">
            {isDanger && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            )}
            <div className="min-w-0">
              <h3 id={titleId} className="text-sm font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
              <p id={descId} className="text-sm text-[var(--text-secondary)] mt-1.5">
                {message}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--border)] transition-colors btn-press"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors btn-press ${
                isDanger
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
