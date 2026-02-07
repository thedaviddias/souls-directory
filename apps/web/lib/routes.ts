/**
 * Centralized route definitions for souls.directory.
 *
 * All navigation paths should reference these constants and helpers.
 * Values are typed as Next.js Route so Link href accepts them without casts.
 */

import type { Route } from 'next'

// =============================================================================
// Static routes (typed as Route for Link href)
// =============================================================================

export const ROUTES = {
  home: '/' as Route,
  souls: '/souls' as Route,
  collections: '/collections' as Route,
  members: '/members' as Route,
  about: '/about' as Route,
  gettingStarted: '/getting-started' as Route,
  quiz: '/quiz' as Route,
  guides: '/guides' as Route,
  faq: '/faq' as Route,
  login: '/login' as Route,
  dashboard: '/dashboard' as Route,
  upload: '/upload' as Route,
  settings: '/settings' as Route,
  terms: '/terms' as Route,
  privacy: '/privacy' as Route,
  feed: '/feed' as Route,
  browse: '/browse' as Route,

  // Dynamic route helpers (return Route for Link href)
  soulDetail: (handle: string, slug: string): Route => `/souls/${handle}/${slug}` as Route,
  userProfile: (handle: string): Route => profilePath(handle),
  collectionDetail: (slug: string): Route => `/collections/${slug}` as Route,
  guideDetail: (slug: string): Route => `/guides/${slug}` as Route,
  uploadEdit: (handle: string, slug: string): Route =>
    `/upload?handle=${encodeURIComponent(handle)}&slug=${encodeURIComponent(slug)}` as Route,
  uploadFork: (handle: string, slug: string): Route =>
    `/upload?fork=${encodeURIComponent(handle)}/${encodeURIComponent(slug)}` as Route,
}

// =============================================================================
// Dynamic route builders (return Route for Link href)
// =============================================================================

/** Soul detail page (handle-scoped: /souls/{handle}/{slug}) */
export function soulPath(handle: string, slug: string): Route {
  return `/souls/${handle}/${slug}` as Route
}

/** Soul comments page (full comment thread) */
export function soulCommentsPath(handle: string, slug: string): Route {
  return `/souls/${handle}/${slug}/comments` as Route
}

/** Soul showcases page (all tweet showcases) */
export function soulShowcasesPath(handle: string, slug: string): Route {
  return `/souls/${handle}/${slug}/showcases` as Route
}

/**
 * Resolve handle for a soul (owner wins when present). Use this everywhere you need a soul URL.
 */
export function getSoulHandle(
  soul: { ownerHandle?: string | null },
  owner?: { handle?: string | null } | null
): string {
  return owner?.handle ?? soul.ownerHandle ?? ''
}

/** Build soul detail route from soul + optional owner. Single place for handle resolution. */
export function soulPathFrom(
  soul: { ownerHandle?: string | null; slug: string },
  owner?: { handle?: string | null } | null
): Route {
  return soulPath(getSoulHandle(soul, owner), soul.slug)
}

/** User public profile - single source of truth for profile URL path */
const PROFILE_PATH_PREFIX = '/members'
export function profilePath(handle: string): Route {
  return `${PROFILE_PATH_PREFIX}/${handle}` as Route
}

/** Collection detail page */
export function collectionPath(slug: string): Route {
  return `/collections/${slug}` as Route
}

/** Guide detail page */
export function guidePath(slug: string): Route {
  return `/guides/${slug}` as Route
}

/** Browse page with search query */
export function browseSearchPath(query: string): Route {
  return `/browse?q=${encodeURIComponent(query)}` as Route
}

/** Browse page filtered by category */
export function browseCategoryPath(slug: string): Route {
  return `/browse?category=${slug}` as Route
}

/** Souls filtered by category */
export function soulsByCategoryPath(categorySlug: string): Route {
  return `/souls?category=${categorySlug}` as Route
}

/** Souls filtered by tag */
export function soulsByTagPath(tagSlug: string): Route {
  return `/souls?tag=${tagSlug}` as Route
}

/** Souls filtered by search query */
export function soulsSearchPath(query: string): Route {
  return `/souls?q=${encodeURIComponent(query)}` as Route
}

/** Souls filtered by sort */
export function soulsSortPath(sort: string): Route {
  return `/souls?sort=${sort}` as Route
}

/** Souls with featured filter */
export function soulsFeaturedPath(): Route {
  return '/souls?featured=true' as Route
}

// =============================================================================
// External links (derived from SITE_CONFIG.socials)
// =============================================================================

import { SITE_CONFIG } from '@/lib/seo'

export const EXTERNAL_LINKS = SITE_CONFIG.socials
