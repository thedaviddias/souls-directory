import { opServer } from '@thedaviddias/analytics/server'
import { logger } from '@/lib/logger'

export function trackServerEvent(event: string, properties: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== 'production') return
  if (!process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID || !process.env.OPENPANEL_CLIENT_SECRET) return

  void opServer.track(event, properties).catch((error) => {
    logger.warn('OpenPanel server tracking failed', {
      event,
      error: error instanceof Error ? error.message : String(error),
    })
  })
}
