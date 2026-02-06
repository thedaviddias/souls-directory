import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '../header'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock useAuthStatus hook to simulate logged-out state
vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: () => ({
    me: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

// Mock GithubStars component
vi.mock('@/components/shared/github-stars', () => ({
  GithubStars: () => React.createElement('div', { 'data-testid': 'github-stars' }, 'GitHub'),
}))

// Mock SearchAutocomplete component
vi.mock('@/components/search/search-autocomplete', () => ({
  SearchAutocomplete: () => null,
}))

describe('Header', () => {
  it('should render the logo', () => {
    render(<Header />)

    expect(screen.getByText('souls.directory')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    render(<Header />)

    // Use exact name "Souls" to avoid matching the logo link "souls.directory"
    expect(screen.getByRole('link', { name: 'Souls' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Members' })).toBeInTheDocument()
  })

  it('should render Sign Up button when logged out', () => {
    render(<Header />)

    // Sign Up button should be visible when user is not authenticated
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/login')
  })

  it('should have correct href for logo', () => {
    render(<Header />)

    const logo = screen.getByRole('link', { name: /souls\.directory/i })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('should have correct hrefs for navigation links', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: 'Souls' })).toHaveAttribute('href', '/souls')
    expect(screen.getByRole('link', { name: 'Members' })).toHaveAttribute('href', '/members')
  })

  it('should apply sticky positioning', () => {
    render(<Header />)

    const header = screen.getByRole('banner')
    expect(header).toHaveClass('sticky', 'top-0')
  })
})
