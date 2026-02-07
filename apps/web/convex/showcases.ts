import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser } from './lib/access'

const NOTE_MAX_LENGTH = 280
const PREVIEW_LIMIT = 3
const LIST_DEFAULT_LIMIT = 12
const LIST_MAX_LIMIT = 24
const RATE_LIMIT_PER_DAY = 3
const MS_PER_DAY = 86400_000

/** Match x.com or twitter.com status URLs and capture tweet ID (numeric). */
const TWEET_URL_REGEX = /^https:\/\/(?:x\.com|twitter\.com)\/(?:\w+\/)?status\/(\d+)(?:\?.*)?$/i

function parseTweetUrl(url: string): { tweetId: string; tweetUrl: string } | null {
  const trimmed = url.trim()
  const match = trimmed.match(TWEET_URL_REGEX)
  if (!match) return null
  return { tweetId: match[1], tweetUrl: trimmed }
}

// Preview: latest 3 non-deleted showcases for a soul
export const preview = query({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const soul = await ctx.db.get(args.soulId)
    const totalCount = soul?.stats.showcases ?? 0

    const all = await ctx.db
      .query('showcases')
      .withIndex('by_soul_created', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .take(100)

    const nonDeleted = all.filter((s) => !s.softDeletedAt)
    const previewItems = nonDeleted.slice(0, PREVIEW_LIMIT)

    const items: Array<{
      showcase: {
        _id: Doc<'showcases'>['_id']
        soulId: Doc<'showcases'>['soulId']
        userId: Doc<'showcases'>['userId']
        tweetId: string
        tweetUrl: string
        note?: string
        createdAt: number
      }
      author: {
        _id: Doc<'users'>['_id']
        handle?: string
        displayName?: string
        image?: string
      } | null
    }> = []

    for (const showcase of previewItems) {
      const author = await ctx.db.get(showcase.userId)
      items.push({
        showcase: {
          _id: showcase._id,
          soulId: showcase.soulId,
          userId: showcase.userId,
          tweetId: showcase.tweetId,
          tweetUrl: showcase.tweetUrl,
          note: showcase.note,
          createdAt: showcase.createdAt,
        },
        author: author
          ? {
              _id: author._id,
              handle: author.handle,
              displayName: author.displayName,
              image: author.image,
            }
          : null,
      })
    }

    return { items, totalCount }
  },
})

// Cursor-based paginated list for dedicated showcases page
export const listPaginated = query({
  args: {
    soulId: v.id('souls'),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT)
    const soul = await ctx.db.get(args.soulId)
    const totalCount = soul?.stats.showcases ?? 0

    const q = ctx.db
      .query('showcases')
      .withIndex('by_soul_created', (q) => {
        const base = q.eq('soulId', args.soulId)
        return args.cursor != null ? base.lt('createdAt', args.cursor) : base
      })
      .order('desc')

    const showcases = await q.take(limit + 1)
    const nonDeleted = showcases.filter((s) => !s.softDeletedAt).slice(0, limit)

    const items: Array<{
      showcase: {
        _id: Doc<'showcases'>['_id']
        soulId: Doc<'showcases'>['soulId']
        userId: Doc<'showcases'>['userId']
        tweetId: string
        tweetUrl: string
        note?: string
        createdAt: number
      }
      author: {
        _id: Doc<'users'>['_id']
        handle?: string
        displayName?: string
        image?: string
      } | null
    }> = []

    for (const showcase of nonDeleted) {
      const author = await ctx.db.get(showcase.userId)
      items.push({
        showcase: {
          _id: showcase._id,
          soulId: showcase.soulId,
          userId: showcase.userId,
          tweetId: showcase.tweetId,
          tweetUrl: showcase.tweetUrl,
          note: showcase.note,
          createdAt: showcase.createdAt,
        },
        author: author
          ? {
              _id: author._id,
              handle: author.handle,
              displayName: author.displayName,
              image: author.image,
            }
          : null,
      })
    }

    const nextCursor =
      showcases.length > limit && items.length > 0
        ? items[items.length - 1]?.showcase.createdAt
        : undefined

    return { items, nextCursor, totalCount }
  },
})

// Add a showcase (submit tweet URL)
export const add = mutation({
  args: {
    soulId: v.id('souls'),
    tweetUrl: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const parsed = parseTweetUrl(args.tweetUrl)
    if (!parsed) {
      throw new ConvexError(
        'Invalid tweet URL. Use a link like https://x.com/username/status/1234567890'
      )
    }

    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    // Rate limit: 3 per soul per user per day
    const dayStart = Math.floor(Date.now() / MS_PER_DAY) * MS_PER_DAY
    const recent = await ctx.db
      .query('showcases')
      .withIndex('by_soul_user', (q) => q.eq('soulId', args.soulId).eq('userId', user._id))
      .order('desc')
      .take(10)

    const todayCount = recent.filter((s) => !s.softDeletedAt && s.createdAt >= dayStart).length
    if (todayCount >= RATE_LIMIT_PER_DAY) {
      throw new ConvexError(
        `You can submit up to ${RATE_LIMIT_PER_DAY} showcases per soul per day. Try again tomorrow.`
      )
    }

    // Reject duplicate tweet ID for this soul
    const existing = await ctx.db
      .query('showcases')
      .withIndex('by_soul_created', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .take(500)
    const alreadySubmitted = existing.some((s) => !s.softDeletedAt && s.tweetId === parsed.tweetId)
    if (alreadySubmitted) {
      throw new ConvexError('This tweet has already been submitted for this soul.')
    }

    const note =
      args.note != null && args.note.trim().length > 0
        ? args.note.trim().slice(0, NOTE_MAX_LENGTH)
        : undefined

    const now = Date.now()

    await ctx.db.insert('showcases', {
      soulId: args.soulId,
      userId: user._id,
      tweetId: parsed.tweetId,
      tweetUrl: parsed.tweetUrl,
      note,
      createdAt: now,
    })

    const currentShowcases = soul.stats.showcases ?? 0
    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        showcases: currentShowcases + 1,
      },
      updatedAt: now,
    })

    return { success: true }
  },
})

// Remove a showcase (soft delete). Allowed: submitter, soul owner, admin, moderator
export const remove = mutation({
  args: { showcaseId: v.id('showcases') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const showcase = await ctx.db.get(args.showcaseId)
    if (!showcase) {
      throw new ConvexError('Showcase not found')
    }
    if (showcase.softDeletedAt) {
      throw new ConvexError('Showcase already removed')
    }

    const soul = await ctx.db.get(showcase.soulId)
    if (!soul) {
      throw new ConvexError('Soul not found')
    }

    const isSubmitter = showcase.userId === user._id
    const isSoulOwner = soul.ownerUserId === user._id
    const isMod = user.role === 'admin' || user.role === 'moderator'

    if (!isSubmitter && !isSoulOwner && !isMod) {
      throw new ConvexError('Not authorized to remove this showcase')
    }

    const now = Date.now()

    await ctx.db.patch(args.showcaseId, {
      softDeletedAt: now,
      deletedBy: user._id,
    })

    const currentShowcases = soul.stats.showcases ?? 0
    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        showcases: Math.max(0, currentShowcases - 1),
      },
      updatedAt: now,
    })

    return { success: true }
  },
})
