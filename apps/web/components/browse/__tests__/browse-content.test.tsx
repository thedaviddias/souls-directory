import type { Category, Soul } from '@/types'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { BrowseContent } from '../browse-content'

const mockSetFilters = vi.fn()

vi.mock('nuqs', () => ({
  parseAsString: Object.assign(() => ({}), {
    withDefault: () => ({}),
  }),
  parseAsBoolean: { withDefault: () => ({}) },
  parseAsStringLiteral: () => ({ withDefault: () => 'recent' }),
  useQueryStates: () => [
    {
      q: '',
      category: null,
      model: null,
      sort: 'recent',
      featured: false,
    },
    mockSetFilters,
  ],
}))

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: { name: string }[] }) =>
    React.createElement('nav', {}, items.map((i) => i.name).join(' / ')),
}))

vi.mock('@/components/layout/page-container', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
}))

vi.mock('@/components/search/search-input', () => ({
  SearchInput: () => React.createElement('input', { 'aria-label': 'Search' }),
}))

vi.mock('@/components/shared/category-badge', () => ({
  CategoryBadge: () => React.createElement('span', {}, 'Category'),
}))

vi.mock('@/components/shared/empty-state', () => ({
  EmptyState: ({ title }: { title: string }) => React.createElement('div', {}, title),
}))

vi.mock('@/components/souls/soul-card', () => ({
  SoulCard: ({ soul }: { soul: Soul }) => React.createElement('div', {}, soul.name),
}))

vi.mock('@/components/souls/soul-card-grid', () => ({
  SoulCardGrid: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
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

const mockCategory: Category = {
  id: '1',
  slug: 'technical',
  name: 'Technical',
  description: 'Tech',
  icon: 'code',
  color: '#00ff00',
}

const mockSoul: Soul = {
  id: '1',
  slug: 'test',
  name: 'Test Soul',
  tagline: 'Tagline',
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

describe('BrowseContent', () => {
  it('renders Browse heading', () => {
    render(<BrowseContent initialCategories={[mockCategory]} initialSouls={[]} />)
    expect(screen.getByRole('heading', { name: 'Browse Souls', level: 1 })).toBeInTheDocument()
  })

  it('renders empty state when no souls match', () => {
    render(<BrowseContent initialCategories={[mockCategory]} initialSouls={[]} />)
    expect(screen.getByText('No souls found')).toBeInTheDocument()
  })

  it('renders soul cards when souls provided', () => {
    render(<BrowseContent initialCategories={[mockCategory]} initialSouls={[mockSoul]} />)
    expect(screen.getByText('Test Soul')).toBeInTheDocument()
  })
})
