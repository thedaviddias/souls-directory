'use client'

import type { ReactNode } from 'react'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { ShortcutsModal } from './shortcuts-modal'

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

/**
 * Provides global keyboard shortcuts and shortcuts modal
 * Wrap your app with this to enable power-user features
 */
export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts()

  return (
    <>
      {children}
      <ShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
