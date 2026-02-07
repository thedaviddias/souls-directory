import { useAuthStatus } from '@/hooks/use-auth-status'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginContent } from '../login-content'

const mockReplace = vi.fn()
const mockSignIn = vi.fn()

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
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: vi.fn(),
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: mockSignIn, signOut: vi.fn() }),
}))

describe('LoginContent', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockSignIn.mockClear()
    vi.mocked(useAuthStatus).mockReturnValue({
      me: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('renders sign in heading and GitHub button when not authenticated', () => {
    render(<LoginContent />)
    expect(screen.getByRole('heading', { name: 'Sign in', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue with GitHub/i })).toBeInTheDocument()
  })

  it('renders Terms and Privacy links', () => {
    render(<LoginContent />)
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('renders Back to home link', () => {
    render(<LoginContent />)
    expect(screen.getByRole('link', { name: /Back to home/i })).toHaveAttribute('href', '/')
  })

  it('redirects to dashboard when already authenticated', () => {
    vi.mocked(useAuthStatus).mockReturnValue({
      me: { _id: '1', handle: 'jane' },
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<LoginContent />)
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
  })

  it('shows loading spinner when auth is loading', () => {
    vi.mocked(useAuthStatus).mockReturnValue({
      me: undefined,
      isAuthenticated: false,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    const { container } = render(<LoginContent />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('calls signIn with github when button clicked', async () => {
    mockSignIn.mockResolvedValue(undefined)
    render(<LoginContent />)
    fireEvent.click(screen.getByRole('button', { name: /Continue with GitHub/i }))
    expect(mockSignIn).toHaveBeenCalledWith('github', { redirectTo: '/dashboard' })
  })
})
