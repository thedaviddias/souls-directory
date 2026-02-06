import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ShortcutsModal } from '../shortcuts-modal'

// Mock the dialog component
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement('div', { role: 'dialog' }, children) : null,
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('h2', { className }, children),
}))

// Mock the shortcuts from hooks
vi.mock('@/hooks', () => ({
  shortcuts: [
    { key: '/', label: 'Focus search' },
    { key: '1-9', label: 'Quick copy soul' },
    { key: 'Escape', label: 'Clear focus' },
    { key: '?', label: 'Show shortcuts' },
  ],
}))

describe('ShortcutsModal', () => {
  it('should render when open is true', () => {
    render(<ShortcutsModal open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading')).toHaveTextContent('Keyboard Shortcuts')
  })

  it('should not render when open is false', () => {
    render(<ShortcutsModal open={false} onOpenChange={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render all shortcuts', () => {
    render(<ShortcutsModal open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText('Focus search')).toBeInTheDocument()
    expect(screen.getByText('Quick copy soul')).toBeInTheDocument()
    expect(screen.getByText('Clear focus')).toBeInTheDocument()
    expect(screen.getByText('Show shortcuts')).toBeInTheDocument()
  })

  it('should render keyboard key indicators', () => {
    render(<ShortcutsModal open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText('/')).toBeInTheDocument()
    expect(screen.getByText('1-9')).toBeInTheDocument()
    expect(screen.getByText('Escape')).toBeInTheDocument()
    // Use getAllByText since '?' appears multiple times (key indicator and help text)
    expect(screen.getAllByText('?').length).toBeGreaterThanOrEqual(1)
  })

  it('should render close instructions', () => {
    render(<ShortcutsModal open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText(/to close/i)).toBeInTheDocument()
  })

  it('should display keyboard shortcuts title', () => {
    render(<ShortcutsModal open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument()
  })
})
