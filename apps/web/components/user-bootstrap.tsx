'use client'

import { api } from '@/lib/convex-api'
import { logger, setUser } from '@/lib/logger'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useEffect, useRef } from 'react'

/**
 * UserBootstrap component ensures user profile is created/updated after login.
 *
 * This component should be placed inside ConvexAuthProvider in providers.tsx.
 * It automatically:
 * 1. Waits for auth state to stabilize via useConvexAuth
 * 2. If user is authenticated but has no record, calls `ensure` to create profile
 * 3. Sets up their handle from GitHub username if needed
 *
 * The component renders nothing visible - it only performs the bootstrap logic.
 */
export function UserBootstrap() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const me = useQuery(api.users.me)
  const ensureUser = useMutation(api.users.ensure)
  const ensuredRef = useRef(false)

  useEffect(() => {
    // Wait for auth state to resolve
    if (authLoading) return

    // Not authenticated -- nothing to bootstrap
    if (!isAuthenticated) return

    // User record already exists
    if (me !== undefined && me !== null) {
      ensuredRef.current = true
      return
    }

    // Authenticated but no user record yet -- create it (once)
    if (me === null && !ensuredRef.current) {
      ensuredRef.current = true
      ensureUser({}).catch((error: unknown) => {
        ensuredRef.current = false
        logger.error('Failed to ensure user profile', error)
      })
    }
  }, [authLoading, isAuthenticated, me, ensureUser])

  // Set Sentry user context when we have a loaded profile (or clear when logged out)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setUser(null)
      return
    }
    if (me !== undefined && me !== null) {
      setUser({
        id: me._id,
        email: me.email ?? undefined,
        username: me.handle ?? me.name ?? undefined,
      })
    }
  }, [authLoading, isAuthenticated, me])

  // This component renders nothing
  return null
}
