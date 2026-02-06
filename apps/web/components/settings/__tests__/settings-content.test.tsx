import { useAuthStatus } from '@/hooks/use-auth-status'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsContent } from '../settings-content'

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockUpdateProfile = vi.fn()
const mockDeleteAccount = vi.fn()
const mockSignOut = vi.fn()

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
  useQuery: vi.fn(),
  useMutation: vi
    .fn()
    .mockReturnValueOnce(mockDeleteAccount)
    .mockReturnValueOnce(mockUpdateProfile)
    .mockReturnValue(vi.fn()),
  useConvex: () => ({}),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
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

describe('SettingsContent', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockUpdateProfile.mockReset().mockResolvedValue(undefined)
    mockDeleteAccount.mockReset().mockResolvedValue(undefined)
    mockSignOut.mockReset().mockResolvedValue(undefined)
    vi.mocked(useAuthStatus).mockReturnValue({
      me: mockUser,
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: mockSignOut,
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
    render(<SettingsContent />)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('shows loading state when auth is loading', () => {
    vi.mocked(useAuthStatus).mockReturnValue({
      me: undefined,
      isAuthenticated: false,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<SettingsContent />)
    expect(screen.getByLabelText('Loading settings...')).toBeInTheDocument()
  })

  it('renders settings form when authenticated', () => {
    render(<SettingsContent />)
    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText('Bio')).toBeInTheDocument()
    expect(screen.getByLabelText('Website')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
  })

  it('shows website URL validation error for invalid URL', () => {
    render(<SettingsContent />)
    const websiteInput = screen.getByLabelText('Website')
    fireEvent.change(websiteInput, { target: { value: 'http://localhost' } })
    fireEvent.blur(websiteInput)
    expect(screen.getByText(/valid https URL/i)).toBeInTheDocument()
  })

  it('shows X handle validation error for invalid format', () => {
    render(<SettingsContent />)
    const xInput = screen.getByLabelText(/X handle/i)
    fireEvent.change(xInput, { target: { value: 'way-too-long-handle-name' } })
    fireEvent.blur(xInput)
    expect(screen.getByText(/1–15 letters/i)).toBeInTheDocument()
  })

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

  it('calls deleteAccount and signOut when delete is confirmed', async () => {
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
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
