import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SectionHeader } from '../section-header'

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

describe('SectionHeader', () => {
  it('renders title as h2 by default', () => {
    render(<SectionHeader title="Featured Souls" />)
    expect(screen.getByRole('heading', { name: 'Featured Souls', level: 2 })).toBeInTheDocument()
  })

  it('renders with custom heading level', () => {
    render(<SectionHeader title="Section" as="h3" />)
    expect(screen.getByRole('heading', { name: 'Section', level: 3 })).toBeInTheDocument()
  })

  it('renders description in card variant', () => {
    render(<SectionHeader title="Recent" description="Recently published souls" />)
    expect(screen.getByText('Recently published souls')).toBeInTheDocument()
  })

  it('renders View all link when viewAllHref provided', () => {
    render(<SectionHeader title="Souls" viewAllHref="/souls" />)
    const link = screen.getByRole('link', { name: /View all/i })
    expect(link).toHaveAttribute('href', '/souls')
  })

  it('label variant renders without description', () => {
    render(<SectionHeader title="About" variant="label" />)
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('label variant with viewAllHref shows link', () => {
    render(
      <SectionHeader title="Content" variant="label" viewAllHref="/more" viewAllText="See all" />
    )
    expect(screen.getByRole('link', { name: 'See all' })).toHaveAttribute('href', '/more')
  })
})
