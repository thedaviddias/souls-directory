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
    expect(screen.getByRole('link', { name: 'souls.directory' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { name: 'Site footer', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Directory')).toBeInTheDocument()
    expect(screen.getByText('Learn')).toBeInTheDocument()
    expect(screen.getByText('Site')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })

  it('renders internal directory links', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Browse All' })).toHaveAttribute('href', '/souls')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Submit Soul' })).toHaveAttribute('href', '/upload')
    expect(screen.getByRole('link', { name: 'llms.txt' })).toHaveAttribute('href', '/llms.txt')
  })

  it('renders external links with target _blank and noopener noreferrer', () => {
    render(<Footer />)
    const externalLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('target') === '_blank')
    expect(externalLinks.length).toBeGreaterThan(0)
    for (const link of externalLinks) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('renders copyright and license text', () => {
    render(<Footer />)
    expect(screen.getByText(/Built by/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'David Dias' })).toBeInTheDocument()
    expect(screen.getByText(/Open source/)).toBeInTheDocument()
  })

  it('renders other projects links with correct href and target _blank', () => {
    render(<Footer />)
    const nav = screen.getByRole('navigation', { name: 'Other open-source projects' })
    expect(nav).toBeInTheDocument()
    const frontendchecklist = screen.getByRole('link', { name: 'frontendchecklist.io' })
    expect(frontendchecklist).toHaveAttribute('href', 'https://frontendchecklist.io')
    expect(frontendchecklist).toHaveAttribute('target', '_blank')
    expect(frontendchecklist).toHaveAttribute('rel', 'noopener noreferrer')
    const goshuin = screen.getByRole('link', { name: 'goshuin.com' })
    expect(goshuin).toHaveAttribute('href', 'https://goshuin.com')
    expect(goshuin).toHaveAttribute('target', '_blank')
  })
})
