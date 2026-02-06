'use client'

import { api } from '@/lib/convex-api'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'

/**
 * Hook to get the current authentication status and user data.
 *
 * Uses the `users.me` query which returns the user if authenticated,
 * null if not authenticated, or undefined while loading.
 *
 * @returns Object containing:
 * - `me`: The current user object or null if not authenticated
 * - `isLoading`: True while initial auth state is being determined
 * - `isAuthenticated`: True if user is logged in
 * - `signIn`: Function to initiate sign-in with a provider
 * - `signOut`: Function to sign out the current user
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { me, isLoading, isAuthenticated, signIn, signOut } = useAuthStatus()
 *
 *   if (isLoading) return <Spinner />
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => signIn('github')}>Sign In</button>
 *   }
 *
 *   return <p>Welcome, {me?.displayName}</p>
 * }
 * ```
 */
export function useAuthStatus() {
  // Get user profile from our database
  // Returns: undefined (loading), null (not auth), or user object (authenticated)
  const me = useQuery(api.users.me)
  const { signIn, signOut } = useAuthActions()

  return {
    /** Current user object or null */
    me: me ?? null,
    /** True while auth state is loading */
    isLoading: me === undefined,
    /** True if user is authenticated (has a user record) */
    isAuthenticated: me !== undefined && me !== null,
    /** Function to sign in with a provider (e.g., 'github') */
    signIn,
    /** Function to sign out */
    signOut,
  }
}
