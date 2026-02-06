import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStatus } from '../use-auth-status'

const { mockUseQuery, mockSignIn, mockSignOut } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useQuery: (query: unknown) => mockUseQuery(query),
  useMutation: () => vi.fn(),
  useConvex: () => ({}),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: mockSignIn,
    signOut: mockSignOut,
  }),
}))

describe('useAuthStatus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockSignIn.mockReset()
    mockSignOut.mockReset()
  })

  it('returns isLoading true when useQuery returns undefined', () => {
    mockUseQuery.mockReturnValue(undefined)
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.me).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isAuthenticated false and me null when useQuery returns null', () => {
    mockUseQuery.mockReturnValue(null)
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.me).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isAuthenticated true and me when useQuery returns user', () => {
    const user = {
      _id: 'user-1',
      name: 'Test User',
      displayName: 'Test',
      handle: 'test',
    }
    mockUseQuery.mockReturnValue(user)
    const { result } = renderHook(() => useAuthStatus())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.me).toEqual(user)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('exposes signIn and signOut from useAuthActions', () => {
    mockUseQuery.mockReturnValue(null)
    const { result } = renderHook(() => useAuthStatus())
    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
    result.current.signIn('github')
    expect(mockSignIn).toHaveBeenCalledWith('github')
    result.current.signOut()
    expect(mockSignOut).toHaveBeenCalled()
  })
})
