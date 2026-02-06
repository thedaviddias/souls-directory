'use client'

import type { AnalyticsEvents } from '@/lib/analytics-events'
import { usePlausible } from 'next-plausible'

export function useAnalytics() {
  const plausible = usePlausible()

  return {
    track: <E extends keyof AnalyticsEvents>(
      event: E,
      ...args: AnalyticsEvents[E] extends never ? [] : [props: AnalyticsEvents[E]]
    ) => {
      plausible(event, args[0] ? { props: args[0] } : undefined)
    },
  }
}
