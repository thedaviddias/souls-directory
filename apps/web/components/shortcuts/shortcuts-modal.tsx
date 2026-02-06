'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { shortcuts } from '@/hooks/use-keyboard-shortcuts'

interface ShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-text flex items-center gap-2 text-sm font-medium">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
            >
              <span className="text-text-secondary text-xs">{shortcut.label}</span>
              <kbd className="px-2 py-0.5 bg-bg border border-border rounded text-text text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-text-muted text-xs mt-4 text-center">
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-bg border border-border rounded text-xs font-mono">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="px-1.5 py-0.5 bg-bg border border-border rounded text-xs font-mono">
            Esc
          </kbd>{' '}
          to close
        </p>
      </DialogContent>
    </Dialog>
  )
}
