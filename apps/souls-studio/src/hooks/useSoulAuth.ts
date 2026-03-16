import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { type MeUser, soulsApi } from '../lib/souls-convex-api'

export function useSoulAuth(enabled: boolean) {
  const me = useQuery(soulsApi.users.me, enabled ? {} : 'skip')
  const { signIn, signOut } = useAuthActions()

  return {
    me: (me ?? null) as MeUser | null,
    isLoading: enabled ? me === undefined : false,
    isAuthenticated: enabled && me !== undefined && me !== null,
    signIn,
    signOut,
  }
}
