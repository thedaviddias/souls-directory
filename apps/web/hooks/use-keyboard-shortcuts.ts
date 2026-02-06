'use client'

import { useCallback, useEffect, useState } from 'react'

export interface KeyboardShortcut {
  key: string
  label: string
  description?: string
}

export const shortcuts: KeyboardShortcut[] = [
  { key: '/', label: 'Focus search' },
  { key: '1-9', label: 'Quick copy soul' },
  { key: 'Escape', label: 'Clear focus' },
  { key: '?', label: 'Show shortcuts' },
]

/**
 * Global keyboard shortcuts for power users
 * - / : Focus search
 * - 1-9 : Quick copy soul by position
 * - ? : Show shortcuts modal
 * - Escape : Clear focus
 */
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input or textarea
    const target = e.target as HTMLElement
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      // Allow escape in inputs
      if (e.key === 'Escape') {
        target.blur()
      }
      return
    }

    switch (e.key) {
      case '/': {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
        searchInput?.focus()
        break
      }

      case '?': {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
        break
      }

      case 'Escape': {
        setShowShortcuts(false)
        const activeElement = document.activeElement as HTMLElement
        activeElement?.blur?.()
        break
      }

      default:
        // Number keys 1-9 for quick copy
        if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const cards = document.querySelectorAll('[data-soul-card]')
          const index = Number.parseInt(e.key) - 1
          if (cards[index]) {
            const copyBtn = cards[index].querySelector<HTMLButtonElement>('[data-copy-button]')
            if (copyBtn) {
              e.preventDefault()
              copyBtn.click()
            }
          }
        }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    showShortcuts,
    setShowShortcuts,
    shortcuts,
  }
}
