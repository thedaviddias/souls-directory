'use client'

import type { AnalyticsEvents } from '@/lib/analytics-events'

export function useAnalytics() {
  return {
    track: <E extends keyof AnalyticsEvents>(
      event: E,
      ...args: AnalyticsEvents[E] extends never ? [] : [props: AnalyticsEvents[E]]
    ) => {
      if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined' || !window.op) {
        return
      }

      window.op.track(event, args[0] ?? {})
    },
  }
}
