import { useAuthStatus } from '@/hooks/use-auth-status'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardContent } from '../dashboard-content'

const { mockReplace, mockPush, mockDeleteSoul, mockUseQuery } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockDeleteSoul: vi.fn(),
  mockUseQuery: vi.fn(),
}))

const mockUser = {
  _id: 'user-1',
  displayName: 'Test User',
  handle: 'testuser',
  name: 'Test User',
}

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, prefetch: vi.fn() }),
}))

vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: () => mockDeleteSoul,
  useConvex: () => ({}),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: { name: string }[] }) =>
    React.createElement('nav', {}, items.map((i) => i.name).join(' ')),
}))

vi.mock('@/components/marketing/section-header', () => ({
  SectionHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h2', {}, children),
}))

vi.mock('@/components/shared/featured-badge', () => ({
  FeaturedBadge: () => React.createElement('span', {}, 'Featured'),
}))

describe('DashboardContent', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockDeleteSoul.mockReset().mockResolvedValue(undefined)
    mockUseQuery.mockReset().mockReturnValue([])
    vi.mocked(useAuthStatus).mockReturnValue({
      me: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('redirects to login when not authenticated', () => {
    vi.mocked(useAuthStatus).mockReturnValue({
      me: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<DashboardContent />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('shows loading spinner when auth loading', () => {
    vi.mocked(useAuthStatus).mockReturnValue({
      me: undefined,
      isAuthenticated: false,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    const { container } = render(<DashboardContent />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders dashboard header and welcome message when authenticated', () => {
    mockUseQuery.mockReturnValue([])
    render(<DashboardContent />)
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Submit Soul/i })).toBeInTheDocument()
  })

  it('opens delete dialog when delete is clicked and confirms delete', async () => {
    mockUseQuery
      .mockReturnValueOnce([
        {
          soul: {
            _id: 'soul-1',
            slug: 'my-soul',
            name: 'My Soul',
            tagline: 'A soul',
            stats: { downloads: 0, stars: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          category: { name: 'Coding', color: '#00ff00' },
        },
      ])
      .mockReturnValueOnce([])
    render(<DashboardContent />)
    const deleteButton = screen.getByRole('button', { name: /Delete/i })
    fireEvent.click(deleteButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const confirmButton = screen.getByRole('button', { name: /Delete|Confirm/i })
    fireEvent.click(confirmButton)
    await vi.waitFor(() => {
      expect(mockDeleteSoul).toHaveBeenCalled()
    })
  })
})
