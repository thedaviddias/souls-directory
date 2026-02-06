import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Footer } from '../footer'

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

describe('Footer', () => {
  it('renders brand and section titles', () => {
    render(<Footer />)
    expect(screen.getByText('souls.directory')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Site footer', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Directory')).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })

  it('renders internal directory links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Browse All' })).toHaveAttribute('href', '/souls')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Submit Soul' })).toHaveAttribute('href', '/upload')
  })

  it('renders external links with target _blank and noopener noreferrer', () => {
    render(<Footer />)
    const openclaw = screen.getByRole('link', { name: /OpenClaw/i })
    expect(openclaw).toHaveAttribute('target', '_blank')
    expect(openclaw).toHaveAttribute('rel', 'noopener noreferrer')
    const github = screen.getByRole('link', { name: 'GitHub' })
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')
    const license = screen.getByRole('link', { name: 'MIT License' })
    expect(license).toHaveAttribute('target', '_blank')
    expect(license).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders copyright and license text', () => {
    render(<Footer />)
    expect(screen.getByText(/Built by/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'David Dias' })).toBeInTheDocument()
    expect(screen.getByText(/Open source/)).toBeInTheDocument()
  })
})
