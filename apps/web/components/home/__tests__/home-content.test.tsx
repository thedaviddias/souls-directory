import type { Category, Soul } from '@/types'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HomeContent } from '../home-content'

vi.mock('@/components/layout/page-container', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'page-container' }, children),
}))

vi.mock('@/components/marketing/section-header', () => ({
  SectionHeader: ({ title }: { title: string }) => React.createElement('h2', {}, title),
}))

vi.mock('@/components/search/search-input', () => ({
  SearchInput: () => React.createElement('input', { 'data-testid': 'search-input' }),
}))

vi.mock('@/components/shared/category-badge', () => ({
  CategoryBadge: () => React.createElement('span', {}, 'Category'),
}))

vi.mock('@/components/souls/soul-card', () => ({
  SoulCard: ({ soul }: { soul: Soul }) => React.createElement('div', {}, soul.name),
}))

vi.mock('@/components/souls/soul-card-grid', () => ({
  SoulCardGrid: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'soul-grid' }, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode
    asChild?: boolean
  }) =>
    asChild
      ? React.createElement(React.Fragment, {}, children)
      : React.createElement('button', { type: 'button', ...props }, children),
}))

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

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: { children: React.ReactNode }) =>
      React.createElement('div', p, children),
    section: ({ children, ...p }: { children: React.ReactNode }) =>
      React.createElement('section', p, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, {}, children),
}))

const mockCategory: Category = {
  id: '1',
  slug: 'technical',
  name: 'Technical',
  description: 'Tech souls',
  icon: 'code',
  color: '#00ff00',
}

const mockSoul: Soul = {
  id: '1',
  slug: 'test',
  name: 'Test Soul',
  tagline: 'A test',
  description: '',
  content: '',
  category_id: '1',
  author: 'Author',
  author_url: null,
  downloads: 0,
  featured: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: mockCategory,
  tags: [],
  ownerHandle: 'test-owner',
}

describe('HomeContent', () => {
  it('renders hero with h1 and CTAs', () => {
    render(
      <HomeContent
        categories={[mockCategory]}
        featured={[]}
        souls={[]}
        recentSouls={[]}
        totalSouls={0}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'Give your agent a soul.', level: 1 })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Publish your soul' })).toHaveAttribute(
      'href',
      '/upload'
    )
    expect(screen.getByRole('link', { name: 'Browse Souls' })).toHaveAttribute('href', '/souls')
  })

  it('renders stats row with counts', () => {
    render(
      <HomeContent
        categories={[mockCategory]}
        featured={[mockSoul]}
        souls={[mockSoul]}
        recentSouls={[mockSoul]}
        totalSouls={42}
      />
    )
    expect(screen.getByText('42 souls')).toBeInTheDocument()
    expect(screen.getByText('1 categories')).toBeInTheDocument()
    expect(screen.getByText('1 featured')).toBeInTheDocument()
  })

  it('renders OpenClaw link in hero', () => {
    render(<HomeContent categories={[]} featured={[]} souls={[]} recentSouls={[]} totalSouls={0} />)
    const openclaw = screen.getByRole('link', { name: 'OpenClaw' })
    expect(openclaw).toHaveAttribute('href', 'https://openclaw.ai')
    expect(openclaw).toHaveAttribute('target', '_blank')
  })
})
