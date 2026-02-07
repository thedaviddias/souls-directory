import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from '../empty-state'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => React.createElement('a', { href, ...props }, children),
}))

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByRole('heading', { name: 'No results', level: 3 })).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try adjusting your search." />)
    expect(screen.getByText('Try adjusting your search.')).toBeInTheDocument()
  })

  it('renders primary action link', () => {
    render(<EmptyState title="Empty" action={{ label: 'Add soul', href: '/upload' }} />)
    const link = screen.getByRole('link', { name: 'Add soul' })
    expect(link).toHaveAttribute('href', '/upload')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders external action with target and rel', () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Learn more', href: 'https://example.com', external: true }}
      />
    )
    const link = screen.getByRole('link', { name: 'Learn more' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders secondary action', () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Primary', href: '/a' }}
        secondaryAction={{ label: 'Secondary', href: '/b' }}
      />
    )
    expect(screen.getByRole('link', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Secondary' })).toBeInTheDocument()
  })
})
