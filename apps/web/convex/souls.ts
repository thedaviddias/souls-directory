import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser, getCurrentUser } from './lib/access'

const MAX_LIST_LIMIT = 50

// Helper to convert soul to public format
function toPublicSoul(soul: Doc<'souls'>) {
  if (!soul || soul.softDeletedAt) return null
  return {
    _id: soul._id,
    slug: soul.slug,
    ownerHandle: soul.ownerHandle ?? null,
    name: soul.name,
    tagline: soul.tagline,
    description: soul.description,
    categoryId: soul.categoryId,
    tagIds: soul.tagIds,
    testedWithModels: soul.testedWithModels,
    forkedFromId: soul.forkedFromId,
    stats: soul.stats,
    featured: soul.featured,
    trendingScore: soul.trendingScore,
    createdAt: soul.createdAt,
    updatedAt: soul.updatedAt,
  }
}

/** Like toPublicSoul but always resolves ownerHandle from owner when missing (for list/featured). */
async function toPublicSoulWithResolvedHandle(
  ctx: QueryCtx,
  soul: Doc<'souls'>
): Promise<NonNullable<ReturnType<typeof toPublicSoul>>> {
  const pub = toPublicSoul(soul)
  if (!pub) throw new Error('unreachable')
  if (pub.ownerHandle == null || pub.ownerHandle === '') {
    const owner = (await ctx.db.get(soul.ownerUserId)) as Doc<'users'> | null
    pub.ownerHandle =
      owner?.handle ?? owner?.githubHandle ?? (owner as { name?: string })?.name ?? ''
  }
  return pub as NonNullable<ReturnType<typeof toPublicSoul>>
}

// Shared handler for building soul detail response (used by getByOwnerAndSlug)
async function buildSoulDetailResponse(ctx: QueryCtx, soul: Doc<'souls'>) {
  const owner = await ctx.db.get(soul.ownerUserId)
  const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
  const latestVersion = soul.latestVersionId ? await ctx.db.get(soul.latestVersionId) : null
  const tags = soul.tagIds ? await Promise.all(soul.tagIds.map((id) => ctx.db.get(id))) : []
  const relatedSouls = soul.relatedSoulIds
    ? await Promise.all(
        soul.relatedSoulIds.map(async (id) => {
          const related = await ctx.db.get(id)
          return related ? toPublicSoul(related as Doc<'souls'>) : null
        })
      )
    : []
  let forkedFrom: { slug: string; ownerHandle: string | null; name: string } | null = null
  if (soul.forkedFromId) {
    const forkedSoul = await ctx.db.get(soul.forkedFromId)
    if (forkedSoul && !(forkedSoul as Doc<'souls'>).softDeletedAt) {
      const f = forkedSoul as Doc<'souls'>
      forkedFrom = { slug: f.slug, ownerHandle: f.ownerHandle ?? null, name: f.name }
    }
  }
  return {
    soul: toPublicSoul(soul),
    forkedFrom,
    owner: owner
      ? {
          _id: (owner as Doc<'users'>)._id,
          handle:
            (owner as Doc<'users'>).handle ??
            (owner as Doc<'users'>).githubHandle ??
            (owner as Doc<'users'> & { name?: string }).name ??
            null,
          displayName:
            (owner as Doc<'users'>).displayName ?? (owner as Doc<'users'> & { name?: string }).name,
          image: (owner as Doc<'users'>).image,
          deletedAt: (owner as Doc<'users'>).deletedAt,
        }
      : null,
    category,
    latestVersion,
    tags: tags.filter(Boolean),
    relatedSouls: relatedSouls.filter(Boolean),
  }
}

// Get soul by owner handle + slug (canonical URL lookup)
export const getByOwnerAndSlug = query({
  args: { handle: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const handleLower = args.handle.trim().toLowerCase()
    const slugLower = args.slug.trim().toLowerCase()
    const soul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', handleLower).eq('slug', slugLower))
      .first()
    if (!soul || soul.softDeletedAt) return null
    return buildSoulDetailResponse(ctx, soul)
  },
})

// List souls with pagination and filters
export const list = query({
  args: {
    categorySlug: v.optional(v.string()),
    tagSlug: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    model: v.optional(v.string()),
    sort: v.optional(
      v.union(
        v.literal('recent'),
        v.literal('published'),
        v.literal('popular'),
        v.literal('trending'),
        v.literal('stars'),
        v.literal('hot')
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, MAX_LIST_LIMIT)
    const sort = args.sort ?? 'recent'

    // Get category ID if filtering by category
    let categoryId: Id<'categories'> | undefined
    if (args.categorySlug) {
      const categorySlug = args.categorySlug
      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', categorySlug))
        .first()
      categoryId = category?._id
    }

    // Get tag ID if filtering by tag
    let tagId: Id<'tags'> | undefined
    if (args.tagSlug) {
      const tagSlug = args.tagSlug
      const tag = await ctx.db
        .query('tags')
        .withIndex('by_slug', (q) => q.eq('slug', tagSlug))
        .first()
      tagId = tag?._id
    }

    // Special handling for "hot" sort - query-time calculation
    if (sort === 'hot') {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      const twoHoursAgo = now - 2 * 60 * 60 * 1000

      // Get downloads from last hour
      const recentDownloads = await ctx.db
        .query('downloads')
        .withIndex('by_date')
        .filter((q) => q.gte(q.field('createdAt'), oneHourAgo))
        .collect()

      // Get downloads from previous hour (for velocity calculation)
      const previousDownloads = await ctx.db
        .query('downloads')
        .withIndex('by_date')
        .filter((q) =>
          q.and(q.gte(q.field('createdAt'), twoHoursAgo), q.lt(q.field('createdAt'), oneHourAgo))
        )
        .collect()

      // Count downloads per soul
      const lastHourCounts = new Map<string, number>()
      for (const dl of recentDownloads) {
        const count = lastHourCounts.get(dl.soulId) ?? 0
        lastHourCounts.set(dl.soulId, count + 1)
      }

      const prevHourCounts = new Map<string, number>()
      for (const dl of previousDownloads) {
        const count = prevHourCounts.get(dl.soulId) ?? 0
        prevHourCounts.set(dl.soulId, count + 1)
      }

      // Calculate hot scores with velocity
      const hotScores: Array<{ soulId: string; count: number; delta: number }> = []
      for (const [soulId, count] of Array.from(lastHourCounts.entries())) {
        const prevCount = prevHourCounts.get(soulId) ?? 0
        const delta = count - prevCount
        hotScores.push({ soulId, count, delta })
      }

      // Sort by count (primary) and delta (secondary)
      hotScores.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return b.delta - a.delta
      })

      // Fetch souls in hot order
      const items: Array<{
        soul: NonNullable<ReturnType<typeof toPublicSoul>>
        category: Doc<'categories'> | null
        hotStats?: { count: number; delta: number }
      }> = []

      for (const { soulId, count, delta } of hotScores.slice(0, limit * 2)) {
        const soul = await ctx.db.get(soulId as Id<'souls'>)
        if (!soul || soul.softDeletedAt) continue
        if (categoryId && soul.categoryId !== categoryId) continue
        if (tagId && !soul.tagIds?.includes(tagId)) continue
        if (items.length >= limit) break

        const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
        const publicSoul = toPublicSoul(soul)
        if (!publicSoul) continue

        items.push({ soul: publicSoul, category, hotStats: { count, delta } })
      }

      return {
        items,
        nextCursor: null, // Hot sort doesn't support pagination well
        hasMore: false,
      }
    }

    // Build query based on sort - use a function to properly type the query
    const getQuery = () => {
      if (args.featured) {
        return ctx.db.query('souls').withIndex('by_featured')
      }
      if (sort === 'published') {
        return ctx.db.query('souls').withIndex('by_created')
      }
      if (sort === 'trending') {
        return ctx.db.query('souls').withIndex('by_trending')
      }
      if (sort === 'popular') {
        return ctx.db.query('souls').withIndex('by_downloads')
      }
      if (sort === 'stars') {
        return ctx.db.query('souls').withIndex('by_stars')
      }
      return ctx.db.query('souls').withIndex('by_updated')
    }

    // Paginate
    const { page, isDone, continueCursor } = await getQuery()
      .order('desc')
      .paginate({ cursor: args.cursor ?? null, numItems: limit * 2 })

    // Filter and transform
    const items: Array<{
      soul: NonNullable<ReturnType<typeof toPublicSoul>>
      category: Doc<'categories'> | null
    }> = []

    for (const soul of page) {
      if (soul.softDeletedAt) continue
      if (categoryId && soul.categoryId !== categoryId) continue
      if (tagId && !soul.tagIds?.includes(tagId)) continue
      if (
        args.model &&
        !soul.testedWithModels?.some((t) => t.model.toLowerCase() === args.model?.toLowerCase())
      )
        continue
      if (items.length >= limit) break

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      const publicSoul = await toPublicSoulWithResolvedHandle(ctx, soul)
      if (!publicSoul) continue

      items.push({ soul: publicSoul, category })
    }

    return {
      items,
      nextCursor: isDone || items.length < limit ? null : continueCursor,
    }
  },
})

// Get featured souls
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, MAX_LIST_LIMIT)

    const souls = await ctx.db
      .query('souls')
      .withIndex('by_featured')
      .order('desc')
      .take(limit * 2)

    const items: Array<{
      soul: NonNullable<ReturnType<typeof toPublicSoul>>
      category: Doc<'categories'> | null
    }> = []

    for (const soul of souls) {
      if (!soul.featured || soul.softDeletedAt) continue
      if (items.length >= limit) break

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      const publicSoul = await toPublicSoulWithResolvedHandle(ctx, soul)
      if (!publicSoul) continue

      items.push({ soul: publicSoul, category })
    }

    return items
  },
})

// Get trending souls (based on recent activity)
export const listTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, MAX_LIST_LIMIT)

    const souls = await ctx.db
      .query('souls')
      .withIndex('by_trending')
      .order('desc')
      .take(limit * 2)

    const items: Array<{
      soul: NonNullable<ReturnType<typeof toPublicSoul>>
      category: Doc<'categories'> | null
    }> = []

    for (const soul of souls) {
      if (soul.softDeletedAt) continue
      if (items.length >= limit) break

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      const publicSoul = await toPublicSoulWithResolvedHandle(ctx, soul)
      if (!publicSoul) continue

      items.push({ soul: publicSoul, category })
    }

    return items
  },
})

// Get soul content by owner handle + slug
export const getContent = query({
  args: { handle: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const handleLower = args.handle.trim().toLowerCase()
    const slugLower = args.slug.trim().toLowerCase()
    const soul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', handleLower).eq('slug', slugLower))
      .first()
    if (!soul || soul.softDeletedAt) return null
    if (!soul.latestVersionId) return null
    const version = await ctx.db.get(soul.latestVersionId)
    return version?.content ?? null
  },
})

// Track download (with deduplication for authenticated users)
export const trackDownload = mutation({
  args: {
    handle: v.string(),
    slug: v.string(),
    userAgent: v.optional(v.string()),
    referer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const handleLower = args.handle.trim().toLowerCase()
    const slugLower = args.slug.trim().toLowerCase()
    const soul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', handleLower).eq('slug', slugLower))
      .first()

    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    // Get current user if authenticated (using proper Convex Auth pattern)
    const user = await getCurrentUser(ctx)

    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    // Deduplication: For authenticated users, only count once per soul per 24 hours
    if (user) {
      const recentDownload = await ctx.db
        .query('downloads')
        .withIndex('by_soul', (q) => q.eq('soulId', soul._id))
        .filter((q) =>
          q.and(q.eq(q.field('userId'), user._id), q.gte(q.field('createdAt'), oneDayAgo))
        )
        .first()

      if (recentDownload) {
        // User already downloaded this soul in the last 24 hours - don't count again
        return { success: true, deduplicated: true }
      }
    }

    // Record download
    await ctx.db.insert('downloads', {
      soulId: soul._id,
      versionId: soul.latestVersionId,
      userId: user?._id,
      userAgent: args.userAgent,
      referer: args.referer,
      createdAt: now,
    })

    // Update soul stats
    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        downloads: soul.stats.downloads + 1,
      },
      updatedAt: now,
    })

    // Update dailyStats for trending calculation
    const today = Math.floor(now / 86400000) // Unix day
    const existingDailyStats = await ctx.db
      .query('dailyStats')
      .withIndex('by_soul_day', (q) => q.eq('soulId', soul._id).eq('day', today))
      .first()

    if (existingDailyStats) {
      await ctx.db.patch(existingDailyStats._id, {
        downloads: existingDailyStats.downloads + 1,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('dailyStats', {
        soulId: soul._id,
        day: today,
        downloads: 1,
        views: 0,
        stars: 0,
        updatedAt: now,
      })
    }

    return { success: true, deduplicated: false }
  },
})

// Star/unstar a soul
export const toggleStar = mutation({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    // Use getAuthenticatedUser which properly uses getAuthUserId from Convex Auth
    const user = await getAuthenticatedUser(ctx)

    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    // Check if already starred
    const existingStar = await ctx.db
      .query('stars')
      .withIndex('by_soul_user', (q) => q.eq('soulId', args.soulId).eq('userId', user._id))
      .first()

    const now = Date.now()

    if (existingStar) {
      // Unstar
      await ctx.db.delete(existingStar._id)
      await ctx.db.patch(soul._id, {
        stats: {
          ...soul.stats,
          stars: Math.max(0, soul.stats.stars - 1),
        },
        updatedAt: now,
      })
      return { starred: false }
    }

    // Star
    await ctx.db.insert('stars', {
      soulId: args.soulId,
      userId: user._id,
      createdAt: now,
    })

    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        stars: soul.stats.stars + 1,
      },
      updatedAt: now,
    })

    // Update dailyStats for trending calculation
    const today = Math.floor(now / 86400000) // Unix day
    const existingDailyStats = await ctx.db
      .query('dailyStats')
      .withIndex('by_soul_day', (q) => q.eq('soulId', args.soulId).eq('day', today))
      .first()

    if (existingDailyStats) {
      await ctx.db.patch(existingDailyStats._id, {
        stars: existingDailyStats.stars + 1,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('dailyStats', {
        soulId: args.soulId,
        day: today,
        downloads: 0,
        views: 0,
        stars: 1,
        updatedAt: now,
      })
    }

    return { starred: true }
  },
})

// Check if user has starred a soul
export const isStarred = query({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    // Use getCurrentUser which properly uses getAuthUserId from Convex Auth
    const user = await getCurrentUser(ctx)
    if (!user) return false

    const star = await ctx.db
      .query('stars')
      .withIndex('by_soul_user', (q) => q.eq('soulId', args.soulId).eq('userId', user._id))
      .first()

    return !!star
  },
})

// Get related souls: manual relatedSoulIds first, then same category, then same tags. Cap at limit, deduplicated.
export const getRelated = query({
  args: {
    soulId: v.id('souls'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 12)
    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) return []

    const collected = new Set<string>()
    const results: Array<NonNullable<ReturnType<typeof toPublicSoul>>> = []

    // 1. Manual related souls
    if (soul.relatedSoulIds?.length) {
      for (const id of soul.relatedSoulIds) {
        if (results.length >= limit) break
        if (id === soul._id) continue
        const doc = await ctx.db.get(id)
        const pub = doc ? toPublicSoul(doc) : null
        if (pub && !collected.has(pub._id)) {
          results.push(pub)
          collected.add(pub._id)
        }
      }
    }

    // 2. Same category
    if (soul.categoryId && results.length < limit) {
      const sameCategory = await ctx.db
        .query('souls')
        .withIndex('by_category', (q) => q.eq('categoryId', soul.categoryId))
        .order('desc')
        .take(20)
      for (const doc of sameCategory) {
        if (results.length >= limit) break
        if (doc._id === soul._id || collected.has(doc._id)) continue
        const pub = toPublicSoul(doc)
        if (pub) {
          results.push(pub)
          collected.add(pub._id)
        }
      }
    }

    // 3. Same tags (scan recent souls, filter by tag overlap)
    const tagIds = soul.tagIds ?? []
    if (tagIds.length > 0 && results.length < limit) {
      const recent = await ctx.db.query('souls').withIndex('by_updated').order('desc').take(60)
      for (const doc of recent) {
        if (results.length >= limit) break
        if (doc._id === soul._id || collected.has(doc._id) || doc.softDeletedAt) continue
        const hasOverlap = doc.tagIds?.some((t) => tagIds.includes(t))
        if (!hasOverlap) continue
        const pub = toPublicSoul(doc)
        if (pub) {
          results.push(pub)
          collected.add(pub._id)
        }
      }
    }

    return results.slice(0, limit)
  },
})

// Get other souls by the same owner (for "More from this Author")
export const getByOwner = query({
  args: {
    ownerUserId: v.id('users'),
    excludeSoulId: v.id('souls'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 3, 10)

    const souls = await ctx.db
      .query('souls')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', args.ownerUserId))
      .order('desc')
      .take(limit + 5) // fetch extra in case we skip some

    const results: Array<NonNullable<ReturnType<typeof toPublicSoul>>> = []
    for (const soul of souls) {
      if (results.length >= limit) break
      if (soul._id === args.excludeSoulId || soul.softDeletedAt) continue
      const pub = toPublicSoul(soul)
      if (pub) results.push(pub)
    }
    return results
  },
})

// ---- Remaining functions (toggleUpvote, isUpvoted, versions, publish,
// ---- checkSlugAvailable, deleteSoul, getForEdit, listForSitemap,
// ---- listForFeed, updateMetadata) have been moved to soulActions.ts
// ---- to stay under TypeScript's FilterApi type depth limit.
