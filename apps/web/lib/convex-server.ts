/**
 * Server-side Convex utilities for SSR in Next.js App Router.
 *
 * Use these functions in Server Components to fetch data at request time.
 * This enables full SSR without client-side loading spinners.
 *
 * All public-facing queries use `safeQuery` to catch Convex errors and
 * return `null` instead of crashing the page with a 500. This is critical
 * for preview deployments where the Convex backend may be empty or
 * misconfigured.
 *
 * Uses Next.js `unstable_cache` for server-side caching with configurable
 * revalidation times. This reduces database load and improves TTFB.
 */

import type { Id } from '@/convex/_generated/dataModel'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { fetchQuery } from 'convex/nextjs'
import { unstable_cache } from 'next/cache'

// Re-export for convenience
export { fetchQuery }
export { api }

// Cache configuration constants (in seconds)
const CACHE_TIMES = {
  categories: 300, // 5 minutes - categories rarely change
  souls: 60, // 1 minute - souls update more frequently
  soulDetail: 30, // 30 seconds - single soul views need fresher data
  members: 300, // 5 minutes - member list can be cached longer
  memberCount: 600, // 10 minutes - total count changes slowly
  collections: 60, // 1 minute - public collections list
} as const

// =============================================================================
// Safe query wrapper
// =============================================================================

/**
 * Wraps a fetchQuery call in try/catch so a Convex failure returns `null`
 * instead of crashing the server component with a 500.
 *
 * Use this for every query that feeds a page render. The calling page
 * should handle `null` by rendering an empty/fallback state.
 */
async function safeQuery<T>(queryFn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await queryFn()
  } catch (error) {
    logger.error(`[convex-server] ${label} failed`, error, { label })
    return null
  }
}

// =============================================================================
// Category Queries
// =============================================================================

/**
 * Fetch categories with soul counts (server-side, cached)
 */
export const getCategories = unstable_cache(
  async () => {
    return safeQuery(() => fetchQuery((api.categories as any).listWithCounts), 'getCategories')
  },
  ['categories-with-counts'],
  { revalidate: CACHE_TIMES.categories, tags: ['categories'] }
)

/**
 * Fetch all categories (server-side, cached)
 */
export const getCategoriesList = unstable_cache(
  async () => {
    return safeQuery(() => fetchQuery(api.categories.list), 'getCategoriesList')
  },
  ['categories-list'],
  { revalidate: CACHE_TIMES.categories, tags: ['categories'] }
)

// =============================================================================
// Soul Queries
// =============================================================================

/**
 * Fetch featured souls (server-side, cached)
 */
export const getFeaturedSouls = unstable_cache(
  async (limit = 8) => {
    return safeQuery(() => fetchQuery(api.souls.listFeatured, { limit }), 'getFeaturedSouls')
  },
  ['featured-souls'],
  { revalidate: CACHE_TIMES.souls, tags: ['souls', 'featured'] }
)

/**
 * Fetch souls list with filters (server-side, no cache)
 * Not cached to ensure fresh data on every request - newly published
 * souls should appear immediately without requiring a force refresh.
 */
export async function getSoulsList(params: {
  categorySlug?: string
  tagSlug?: string
  featured?: boolean
  model?: string
  sort?: 'recent' | 'published' | 'popular' | 'trending' | 'stars' | 'hot'
  limit?: number
}) {
  return safeQuery(
    () =>
      fetchQuery(api.souls.list, {
        categorySlug: params.categorySlug,
        tagSlug: params.tagSlug,
        featured: params.featured,
        model: params.model,
        sort: params.sort ?? 'recent',
        limit: params.limit ?? 24,
      }),
    'getSoulsList'
  )
}

/**
 * Fetch a single soul by owner handle and slug (server-side, cached)
 */
export async function getSoulByOwnerAndSlug(handle: string, slug: string) {
  const cacheKey = `soul-${handle}-${slug}`
  const cachedFetch = unstable_cache(
    async () => {
      return safeQuery(
        () => fetchQuery(api.souls.getByOwnerAndSlug, { handle, slug }),
        `getSoulByOwnerAndSlug(${handle},${slug})`
      )
    },
    [cacheKey],
    { revalidate: CACHE_TIMES.soulDetail, tags: ['souls', cacheKey] }
  )

  return cachedFetch()
}

/**
 * Fetch soul content by owner handle and slug (server-side, cached)
 */
export async function getSoulContentByOwnerAndSlug(handle: string, slug: string) {
  const cacheKey = `soul-content-${handle}-${slug}`
  const cachedFetch = unstable_cache(
    async () => {
      return safeQuery(
        () => fetchQuery(api.souls.getContent, { handle, slug }),
        `getSoulContent(${handle},${slug})`
      )
    },
    [cacheKey],
    { revalidate: CACHE_TIMES.soulDetail, tags: ['souls', cacheKey] }
  )

  return cachedFetch()
}

/**
 * Fetch related souls for a soul (auto: manual + same category + same tags, capped)
 */
export async function getRelatedSouls(soulId: string, limit = 6) {
  return safeQuery(
    () => fetchQuery(api.souls.getRelated, { soulId: soulId as Id<'souls'>, limit }),
    'getRelatedSouls'
  )
}

/**
 * Fetch other souls by the same owner (for "More from this Author")
 */
export async function getSoulsByOwner(ownerUserId: string, excludeSoulId: string, limit = 3) {
  return safeQuery(
    () =>
      fetchQuery(api.souls.getByOwner, {
        ownerUserId: ownerUserId as Id<'users'>,
        excludeSoulId: excludeSoulId as Id<'souls'>,
        limit,
      }),
    'getSoulsByOwner'
  )
}

// =============================================================================
// User Queries
// =============================================================================

/**
 * Fetch user by handle (server-side, cached per handle)
 */
export async function getUserByHandle(handle: string) {
  const cachedFetch = unstable_cache(
    async () => {
      return safeQuery(
        () => fetchQuery(api.users.getByHandle, { handle }),
        `getUserByHandle(${handle})`
      )
    },
    [`user-${handle}`],
    { revalidate: CACHE_TIMES.members, tags: ['users', `user-${handle}`] }
  )

  return cachedFetch()
}

/**
 * Fetch souls by user (server-side, cached per user)
 */
export async function getSoulsByUser(userId: string) {
  const cachedFetch = unstable_cache(
    async () => {
      return safeQuery(
        () => fetchQuery(api.users.getSoulsByUser, { userId: userId as Id<'users'>, limit: 20 }),
        `getSoulsByUser(${userId})`
      )
    },
    [`user-souls-${userId}`],
    { revalidate: CACHE_TIMES.souls, tags: ['souls', `user-${userId}`] }
  )

  return cachedFetch()
}

// =============================================================================
// Member Queries
// =============================================================================

/**
 * Fetch members list with pagination and search (server-side, cached)
 */
export async function getMembers(params: {
  search?: string
  limit?: number
  cursor?: string
  sort?: 'recent' | 'active'
}) {
  // Create a stable cache key from params
  const cacheKey = `members-${params.search || 'all'}-${params.sort || 'recent'}-${params.limit || 24}-${params.cursor || 'start'}`

  const cachedFetch = unstable_cache(
    async () => {
      return safeQuery(
        () =>
          fetchQuery((api.users as any).listMembers, {
            search: params.search,
            limit: params.limit ?? 24,
            cursor: params.cursor,
            sort: params.sort ?? 'recent',
          }),
        'getMembers'
      )
    },
    [cacheKey],
    { revalidate: CACHE_TIMES.members, tags: ['members'] }
  )

  return cachedFetch()
}

/**
 * Fetch total member count (server-side, cached)
 */
export const getMemberCount = unstable_cache(
  async () => {
    return safeQuery(() => fetchQuery((api.users as any).getMemberCount), 'getMemberCount')
  },
  ['member-count'],
  { revalidate: CACHE_TIMES.memberCount, tags: ['members'] }
)

// =============================================================================
// Sitemap / SEO Data Fetching
// =============================================================================

/**
 * Fetch all souls for sitemap generation (server-side, cached)
 */
export const getAllSoulsForSitemap = unstable_cache(
  async () => {
    return safeQuery(() => fetchQuery(api.soulActions.listForSitemap), 'getAllSoulsForSitemap')
  },
  ['sitemap-souls'],
  { revalidate: 3600, tags: ['souls', 'sitemap'] } // 1 hour cache
)

/**
 * Fetch all users with public handles for sitemap (server-side, cached)
 */
export const getAllUsersForSitemap = unstable_cache(
  async () => {
    return safeQuery(() => fetchQuery((api.users as any).listForSitemap), 'getAllUsersForSitemap')
  },
  ['sitemap-users'],
  { revalidate: 3600, tags: ['users', 'sitemap'] } // 1 hour cache
)

/**
 * Fetch recent souls for RSS feed (server-side, cached)
 */
export const getSoulsForFeed = unstable_cache(
  async (limit = 20) => {
    return safeQuery(() => fetchQuery(api.soulActions.listForFeed, { limit }), 'getSoulsForFeed')
  },
  ['feed-souls'],
  { revalidate: 300, tags: ['souls', 'feed'] } // 5 minute cache
)

/**
 * Fetch version history for a soul (last N versions for detail page)
 */
export async function getVersionHistory(soulId: string, limit = 5) {
  return safeQuery(
    () => fetchQuery(api.soulActions.getVersionHistory, { soulId: soulId as Id<'souls'>, limit }),
    'getVersionHistory'
  )
}

/**
 * Fetch public collections (for /collections page)
 */
/**
 * Return type for collections.getBySlug.
 * Re-established here because api is widened in convex-api (FilterApi depth limit).
 */
export interface CollectionBySlugResult {
  collection: {
    _id: string
    slug: string
    name: string
    description: string | null
    isPublic: boolean
    coverImageUrl: string | null
    soulCount: number
    createdAt: number
    updatedAt: number
  }
  owner: {
    _id: string
    handle: string | null
    displayName: string | null
    image: string | null
  } | null
  souls: Array<{
    soul: {
      _id: string
      slug: string
      name: string
      tagline: string
      stats: { downloads: number; stars: number; upvotes?: number; versions: number }
    } | null
    note?: string
    addedAt: number
  }>
  isOwner: boolean
}

/**
 * Fetch a single collection by slug (for /collections/[slug])
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionBySlugResult | null> {
  return safeQuery(
    () => fetchQuery(api.collections.getBySlug, { slug }),
    'getCollectionBySlug'
  ) as Promise<CollectionBySlugResult | null>
}

/**
 * Return type for collections.listPublic.
 * Re-established here because api is widened in convex-api (FilterApi depth limit).
 */
export interface PublicCollectionItem {
  collection: {
    _id: string
    slug: string
    name: string
    description?: string
    coverImageUrl?: string
    soulCount: number
  }
  owner: {
    _id: string
    handle?: string
    displayName?: string
    image?: string
  } | null
}

export const getPublicCollections = unstable_cache(
  async (limit = 20): Promise<PublicCollectionItem[] | null> => {
    return safeQuery(
      () => fetchQuery(api.collections.listPublic, { limit }),
      'getPublicCollections'
    ) as Promise<PublicCollectionItem[] | null>
  },
  ['public-collections'],
  {
    revalidate: CACHE_TIMES.collections,
    tags: ['collections'],
  }
)
