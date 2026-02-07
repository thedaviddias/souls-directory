import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mock functions so they're available when vi.mock factories run
const {
  mockReplace,
  mockPush,
  mockUpdateProfile,
  mockDeleteAccount,
  mockSignOut,
  mockUseAuthStatus,
  mockUseMutation,
} = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockUpdateProfile: vi.fn().mockResolvedValue(undefined),
  mockDeleteAccount: vi.fn().mockResolvedValue(undefined),
  mockSignOut: vi.fn().mockResolvedValue(undefined),
  mockUseAuthStatus: vi.fn(),
  mockUseMutation: vi.fn(),
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, prefetch: vi.fn() }),
  usePathname: () => '/settings',
}))

vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: mockUseAuthStatus,
}))

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: mockUseMutation,
  useConvex: () => ({}),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/convex-api', () => ({
  api: {
    users: {
      deleteAccount: 'users:deleteAccount',
      updateProfile: 'users:updateProfile',
    },
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: { name: string }[] }) =>
    React.createElement('nav', { 'data-testid': 'breadcrumb' }, items.map((i) => i.name).join(' ')),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode
    type?: string
    onClick?: () => void
    disabled?: boolean
  }) =>
    React.createElement(
      'button',
      {
        type: type === 'submit' || type === 'reset' ? type : 'button',
        onClick,
        disabled,
        ...props,
      },
      children
    ),
}))

// Lazy-import the component under test AFTER mocks are set up
const { SettingsContent } = await import('../settings-content')

const mockUser = {
  _id: 'user-1',
  name: 'Test User',
  handle: 'testuser',
  displayName: 'Test User',
  bio: '',
  image: undefined,
  email: 'test@example.com',
  websiteUrl: '',
  xHandle: '',
  mastodonHandle: '',
  blueskyHandle: '',
  githubHandle: 'testuser',
  role: 'user',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

describe('SettingsContent', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockUpdateProfile.mockReset().mockResolvedValue(undefined)
    mockDeleteAccount.mockReset().mockResolvedValue(undefined)
    mockSignOut.mockReset().mockResolvedValue(undefined)

    // useMutation is called for deleteAccount then updateProfile.
    // Route based on the mutation name string from the stub api object.
    mockUseMutation.mockReset().mockImplementation((mutationRef: string) => {
      if (typeof mutationRef === 'string' && mutationRef.includes('deleteAccount')) {
        return mockDeleteAccount
      }
      if (typeof mutationRef === 'string' && mutationRef.includes('updateProfile')) {
        return mockUpdateProfile
      }
      return vi.fn()
    })

    mockUseAuthStatus.mockReturnValue({
      me: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: mockSignOut,
    })
  })

  // ---------------------------------------------------------------------------
  // Authentication guard
  // ---------------------------------------------------------------------------

  it('redirects to login when not authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      me: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<SettingsContent />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('shows loading spinner when auth is loading', () => {
    mockUseAuthStatus.mockReturnValue({
      me: undefined,
      isAuthenticated: false,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<SettingsContent />)
    expect(screen.getByLabelText('Loading settings...')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Form rendering
  // ---------------------------------------------------------------------------

  it('renders Settings heading and editable form fields', () => {
    render(<SettingsContent />)
    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText('Bio')).toBeInTheDocument()
    expect(screen.getByLabelText('Website')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Client-side validation — these tests should catch real validation regressions
  // ---------------------------------------------------------------------------

  it('rejects http://localhost as a website URL', () => {
    render(<SettingsContent />)
    const websiteInput = screen.getByLabelText('Website')
    fireEvent.change(websiteInput, { target: { value: 'http://localhost' } })
    fireEvent.blur(websiteInput)
    expect(screen.getByText(/valid https URL/i)).toBeInTheDocument()
  })

  it('rejects private IPs in website URL', () => {
    render(<SettingsContent />)
    const websiteInput = screen.getByLabelText('Website')
    fireEvent.change(websiteInput, { target: { value: 'https://192.168.1.1' } })
    fireEvent.blur(websiteInput)
    expect(screen.getByText(/valid https URL/i)).toBeInTheDocument()
  })

  it('accepts valid HTTPS URL', () => {
    render(<SettingsContent />)
    const websiteInput = screen.getByLabelText('Website')
    fireEvent.change(websiteInput, { target: { value: 'https://example.com' } })
    fireEvent.blur(websiteInput)
    // No error should appear for valid URL
    expect(screen.queryByText(/valid https URL/i)).not.toBeInTheDocument()
  })

  it('rejects X handles longer than 15 characters', () => {
    render(<SettingsContent />)
    const xInput = screen.getByLabelText(/X handle/i)
    fireEvent.change(xInput, { target: { value: 'way-too-long-handle-name' } })
    fireEvent.blur(xInput)
    expect(screen.getByText(/1–15 letters/i)).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Account deletion flow
  // ---------------------------------------------------------------------------

  it('disables delete button until confirmation checkbox is checked', () => {
    render(<SettingsContent />)
    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    expect(deleteButton).toBeDisabled()

    const checkbox = screen.getByRole('checkbox', {
      name: /I understand this action is permanent/i,
    })
    fireEvent.click(checkbox)
    expect(deleteButton).not.toBeDisabled()
  })

  it('calls deleteAccount mutation, signs out, and redirects home', async () => {
    render(<SettingsContent />)
    const checkbox = screen.getByRole('checkbox', {
      name: /I understand this action is permanent/i,
    })
    fireEvent.click(checkbox)

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i })
    fireEvent.click(deleteButton)

    await vi.waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
