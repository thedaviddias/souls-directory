import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileContent } from '../profile-content'

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

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}))

vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: () => ({ me: null }),
}))

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: { name: string }[] }) =>
    React.createElement('nav', {}, items.map((i) => i.name).join(' ')),
}))

vi.mock('@/components/marketing/section-header', () => ({
  SectionHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h2', {}, children),
}))

vi.mock('@/components/shared/category-badge', () => ({
  CategoryBadge: ({ category }: { category: { name: string } }) =>
    React.createElement('span', {}, category?.name ?? ''),
}))

vi.mock('@/components/shared/featured-badge', () => ({
  FeaturedBadge: () => React.createElement('span', {}, 'Featured'),
}))

const visibleUser = {
  id: 'user-1',
  name: 'Jane',
  handle: 'jane',
  displayName: 'Jane Doe',
  bio: 'Developer',
  websiteUrl: 'https://jane.com',
  xHandle: 'jane',
  mastodonHandle: 'jane@mastodon.social',
  blueskyHandle: 'jane.bsky.social',
  githubHandle: 'jane',
}

const deletedUser = {
  ...visibleUser,
  id: 'user-2',
  handle: 'deleted',
  deletedAt: Date.now(),
}

const soulData = {
  soul: {
    id: 'soul-1',
    slug: 'my-soul',
    ownerHandle: 'jane',
    name: 'My Soul',
    tagline: 'A soul',
    downloads: 10,
    stars: 5,
    upvotes: 0,
    featured: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  category: { slug: 'coding', name: 'Coding', color: '#00ff00' },
}

describe('ProfileContent', () => {
  it('shows User Not Found for deleted user', () => {
    render(<ProfileContent user={deletedUser} souls={[]} />)
    expect(screen.getByRole('heading', { name: 'User Not Found', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/This user account has been deleted/)).toBeInTheDocument()
  })

  it('renders profile header with name and handle', () => {
    render(<ProfileContent user={visibleUser} souls={[]} />)
    expect(screen.getByRole('heading', { name: 'Jane', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/@jane/)).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })

  it('renders social links when present', () => {
    render(<ProfileContent user={visibleUser} souls={[]} />)
    expect(screen.getByRole('link', { name: /jane\.com/i })).toHaveAttribute(
      'href',
      'https://jane.com'
    )
    expect(screen.getByRole('link', { name: /Mastodon/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bluesky/i })).toBeInTheDocument()
  })

  it('renders souls grid when souls provided', () => {
    render(<ProfileContent user={visibleUser} souls={[soulData]} />)
    expect(screen.getByText('My Soul')).toBeInTheDocument()
    expect(screen.getByText('A soul')).toBeInTheDocument()
  })

  it('renders empty state when user has no souls', () => {
    render(<ProfileContent user={visibleUser} souls={[]} />)
    expect(screen.getByText(/hasn't published any souls yet/)).toBeInTheDocument()
  })
})
