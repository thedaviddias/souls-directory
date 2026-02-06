import type { Soul } from '@/types'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SoulCard } from '../soul-card'

const mockSoul: Soul = {
  id: '1',
  slug: 'stark',
  ownerHandle: 'testuser',
  name: 'Stark',
  tagline: 'Sharp wit, clean code',
  description: 'A senior engineer',
  content: '# SOUL.md',
  category_id: '1',
  author: 'OpenClaw',
  author_url: null,
  downloads: 2847,
  featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: {
    id: '1',
    slug: 'coding',
    name: 'Coding',
    description: 'Developer assistants',
    icon: 'code',
    color: '#00ff88',
  },
  tags: [],
}

describe('SoulCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders soul name and tagline', () => {
    render(<SoulCard soul={mockSoul} />)

    expect(screen.getByText('Stark')).toBeInTheDocument()
    expect(screen.getByText('Sharp wit, clean code')).toBeInTheDocument()
  })

  it('renders download count', () => {
    render(<SoulCard soul={mockSoul} />)

    expect(screen.getByText(/2,847\s+downloads/)).toBeInTheDocument()
  })

  it('renders category badge when category exists', () => {
    render(<SoulCard soul={mockSoul} />)

    // Category name should be present (icon is now an SVG component)
    expect(screen.getByText('Coding')).toBeInTheDocument()
  })

  it('links to soul detail page', () => {
    render(<SoulCard soul={mockSoul} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/souls/testuser/stark')
  })

  it('renders without category badge when no category', () => {
    const soulWithoutCategory = { ...mockSoul, category: undefined }
    render(<SoulCard soul={soulWithoutCategory} />)

    expect(screen.queryByText('Coding')).not.toBeInTheDocument()
  })
})
