import { Command } from 'cmdk'
import {
  Download,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useModalAccessibility } from '../hooks/useModalAccessibility'

interface CommandPaletteProps {
  onSwitchToModule: (module: 'library' | 'souls' | 'agents') => void
  onCreateSoul: () => void
  onOpenSettings: () => void
  onRefresh: () => void
  onWhatsNew?: () => void
  onCheckUpdate?: () => void
}

export function CommandPalette({
  onSwitchToModule,
  onCreateSoul,
  onOpenSettings,
  onRefresh,
  onWhatsNew,
  onCheckUpdate,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const closeCommandPalette = useCallback(() => setOpen(false), [])
  const { modalRef: cmdRef } = useModalAccessibility(open, closeCommandPalette)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('souls-studio:open-command-palette', handleOpen)
    return () => window.removeEventListener('souls-studio:open-command-palette', handleOpen)
  }, [])

  const runAction = (action: () => void) => {
    setOpen(false)
    action()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 animate-overlay flex justify-center pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div ref={cmdRef} className="relative w-full max-w-lg h-fit animate-fade-in-scale">
        <Command
          className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        >
          <div className="flex items-center gap-2 px-4 border-b border-[var(--border)]">
            <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" aria-hidden="true" />
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full py-3 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-sm text-center text-[var(--text-muted)]">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
            >
              <Command.Item
                onSelect={() => runAction(() => onSwitchToModule('library'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Go to Explore</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘1
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => onSwitchToModule('agents'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Go to AI Agents</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘2
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(() => onSwitchToModule('souls'))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Go to My Souls</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘3
                </kbd>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-[var(--border)] my-1" />

            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
            >
              <Command.Item
                onSelect={() => runAction(onCreateSoul)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Create New Soul</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘N
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(onRefresh)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Refresh</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘R
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runAction(onOpenSettings)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1">Open Settings</span>
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] data-[selected=true]:bg-white/20 rounded border border-[var(--border)] data-[selected=true]:border-white/30">
                  ⌘,
                </kbd>
              </Command.Item>
              {onWhatsNew && (
                <Command.Item
                  onSelect={() => runAction(onWhatsNew)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>What's New</span>
                </Command.Item>
              )}
              {onCheckUpdate && (
                <Command.Item
                  onSelect={() => runAction(onCheckUpdate)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] cursor-pointer data-[selected=true]:bg-[var(--accent)] data-[selected=true]:text-white"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Check for Updates</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Souls Studio
            </span>
            <span className="ml-auto">
              <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border)]">
                ↑↓
              </kbd>{' '}
              navigate
              <span className="mx-1.5">·</span>
              <kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border)]">
                ↵
              </kbd>{' '}
              select
            </span>
          </div>
        </Command>
      </div>
    </div>
  )
}
