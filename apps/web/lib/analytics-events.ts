/**
 * Centralized analytics event definitions.
 * Add new events here — this is the single source of truth.
 *
 * Plausible custom properties docs:
 * https://plausible.io/docs/custom-props/introduction
 */
export type AnalyticsEvents = {
  // Conversions
  signup: { method: 'github' }
  soul_upload: { category?: string }
  soul_download: { slug: string }
  soul_star: { slug: string }

  // Engagement
  search: { query: string }
  filter_category: { category: string }
  filter_tag: { tag: string }
  profile_view: { handle: string }
  collection_create: never
  github_import: { url: string }

  // Navigation (outbound_click is auto-tracked by next-plausible; listed for documentation)
  outbound_click: { url: string }
}

export type AnalyticsEventName = keyof AnalyticsEvents
