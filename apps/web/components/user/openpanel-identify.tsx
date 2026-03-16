'use client'

import { useConvexAuth, useQuery } from 'convex/react'
import { useEffect } from 'react'
import { api } from '@/lib/convex-api'

function splitName(name?: string | null) {
  const trimmed = name?.trim()
  if (!trimmed) {
    return {}
  }

  const [firstName, ...rest] = trimmed.split(/\s+/)
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(' ') : undefined,
  }
}

export function OpenPanelIdentify() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const me = useQuery(api.users.me)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.op || process.env.NODE_ENV !== 'production') {
      return
    }

    if (isLoading || me === undefined) {
      return
    }

    if (!isAuthenticated || !me) {
      window.op.clear()
      return
    }

    const identity = splitName(me.displayName ?? me.name)

    window.op.identify({
      profileId: me._id,
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: me.email ?? undefined,
      properties: {
        handle: me.handle ?? undefined,
        githubHandle: me.githubHandle ?? undefined,
        role: me.role ?? undefined,
      },
    })
  }, [isAuthenticated, isLoading, me])

  return null
}
