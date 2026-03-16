import { OpenPanel } from '@openpanel/web'

let op: OpenPanel | null = null

export function initAnalytics() {
  const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID?.trim()
  if (!clientId) return

  op = new OpenPanel({
    clientId,
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
  })
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  op?.track(name, properties)
}

export function identifyUser(profileId: string, traits?: Record<string, unknown>) {
  op?.identify({ profileId, ...traits })
}

export function resetAnalytics() {
  op?.clear()
}
