import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Provides focus trap, focus return, scroll lock, and Escape-to-close
 * for modal dialogs per WAI-ARIA dialog pattern.
 */
export function useModalAccessibility(open: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Store trigger element and lock scroll
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Focus first focusable element on open
  useEffect(() => {
    if (open && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      focusable[0]?.focus()
    }
  }, [open])

  // Restore focus to trigger element on close
  useEffect(() => {
    if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [open])

  // Keyboard: Escape + focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose]
  )

  return { modalRef, handleKeyDown }
}
