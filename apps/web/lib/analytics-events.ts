/**
 * Centralized analytics event definitions.
 * Add new events here — this is the single source of truth.
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
  homepage_skill_cta_click: { location: 'hero' | 'builder' }
  homepage_skill_modal_open: { location: 'hero' | 'builder' }
  homepage_skill_command_copy: { location: 'hero' | 'builder' }
  soul_builder_generate: {
    useCase: string
    workingStyle: string
    uncertaintyMode: string
    disagreementStyle: string
  }
  soul_builder_redirected_to_upload: {
    useCase: string
    categorySlug: string
  }

  // Navigation (outbound clicks are auto-tracked by OpenPanel; listed for documentation)
  outbound_click: { url: string }
}

export type AnalyticsEventName = keyof AnalyticsEvents
