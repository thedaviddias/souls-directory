import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useGateway } from '../contexts/GatewayContext'
import { GatewayPopover } from './GatewayPopover'

const statusColors: Record<string, string> = {
  connected: '#22c55e',
  connecting: '#eab308',
  error: '#ef4444',
  disconnected: '#6b7280',
}

export function GatewayStatusIndicator() {
  const { status, activeConnection, reconnecting } = useGateway()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close popover on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  let dotColor: string
  let label: string

  if (status === 'connected') {
    dotColor = statusColors.connected
    label = activeConnection?.name ?? 'Connected'
  } else if (status === 'connecting') {
    dotColor = statusColors.connecting
    label = 'Connecting...'
  } else if (status === 'error' && reconnecting) {
    dotColor = statusColors.connecting
    label = 'Reconnecting...'
  } else if (status === 'error') {
    dotColor = statusColors.error
    label = 'Connection failed'
  } else {
    dotColor = statusColors.disconnected
    label = 'Not connected'
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors text-xs btn-press"
        aria-label={`Gateway status: ${label}. Click to manage connections.`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'connected' ? 'animate-ping' : ''}`}
            style={{ backgroundColor: dotColor }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: dotColor }}
          />
        </span>
        <span className="text-[var(--text-secondary)] font-medium max-w-[120px] truncate">
          {label}
        </span>
        <ChevronDown
          className="w-3 h-3 text-[var(--text-muted)] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
          aria-hidden="true"
        />
      </button>

      {open && <GatewayPopover onClose={() => setOpen(false)} />}
    </div>
  )
}
