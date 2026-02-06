import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser } from './lib/access'

const COMMENT_MAX_LENGTH = 2000
const MAX_URLS_PER_COMMENT = 5
const REPEATED_CHAR_THRESHOLD = 0.5 // reject if >50% of non-space chars are the same

// Zero-width and invisible Unicode characters to strip
const ZERO_WIDTH_CHARS = '\u200B\u200C\u200D\uFEFF\u00AD\u2060'

function sanitizeCommentBody(raw: string): { body: string; error?: string } {
  let body = raw
  for (const c of ZERO_WIDTH_CHARS) {
    body = body.split(c).join('')
  }
  body = body.trim()

  // Count URLs (simple pattern: http(s) or www.)
  const urlLike = /https?:\/\/[^\s]+|www\.[^\s]+/gi
  const urls = body.match(urlLike) ?? []
  if (urls.length > MAX_URLS_PER_COMMENT) {
    return { body: '', error: 'Comment contains too many links.' }
  }

  // Reject if >50% of non-space characters are the same (flooding)
  const nonSpace = body.replace(/\s/g, '')
  if (nonSpace.length > 20) {
    const charCounts = new Map<string, number>()
    for (const c of nonSpace) {
      charCounts.set(c, (charCounts.get(c) ?? 0) + 1)
    }
    let maxCount = 0
    for (const count of charCounts.values()) {
      if (count > maxCount) maxCount = count
    }
    if (maxCount / nonSpace.length > REPEATED_CHAR_THRESHOLD) {
      return { body: '', error: 'Comment looks like spam or repeated characters.' }
    }
  }

  return { body }
}

// List comments for a soul
export const list = query({
  args: {
    soulId: v.id('souls'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100)

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_soul', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .take(limit)

    const result: Array<{
      comment: {
        _id: Doc<'comments'>['_id']
        body: string
        parentCommentId?: Doc<'comments'>['_id']
        createdAt: number
        updatedAt?: number
      }
      author: {
        _id: Doc<'users'>['_id']
        handle?: string
        displayName?: string
        image?: string
      } | null
    }> = []

    for (const comment of comments) {
      if (comment.softDeletedAt) continue

      const author = await ctx.db.get(comment.userId)
      result.push({
        comment: {
          _id: comment._id,
          body: comment.body,
          parentCommentId: comment.parentCommentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
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

    return result
  },
})

type CommentWithAuthor = {
  comment: {
    _id: Doc<'comments'>['_id']
    body: string
    parentCommentId?: Doc<'comments'>['_id']
    createdAt: number
    updatedAt?: number
  }
  author: {
    _id: Doc<'users'>['_id']
    handle?: string
    displayName?: string
    image?: string
  } | null
}

async function buildCommentResults(
  ctx: { db: { get: (id: Doc<'comments'>['userId']) => Promise<Doc<'users'> | null> } },
  comments: Array<Doc<'comments'>>
): Promise<CommentWithAuthor[]> {
  const result: CommentWithAuthor[] = []
  for (const comment of comments) {
    if (comment.softDeletedAt) continue
    const author = await ctx.db.get(comment.userId)
    result.push({
      comment: {
        _id: comment._id,
        body: comment.body,
        parentCommentId: comment.parentCommentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
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
  return result
}

// Cursor-based paginated list for dedicated comments page
export const listPaginated = query({
  args: {
    soulId: v.id('souls'),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)
    const soul = await ctx.db.get(args.soulId)
    const totalCount = soul?.stats.comments ?? 0

    const q = ctx.db
      .query('comments')
      .withIndex('by_soul_created', (q) => {
        const base = q.eq('soulId', args.soulId)
        return args.cursor != null ? base.lt('createdAt', args.cursor) : base
      })
      .order('desc')
    const comments = await q.take(limit + 1)

    const items = await buildCommentResults(ctx, comments.slice(0, limit))
    const nextCursor = comments.length > limit ? comments[limit - 1]?.createdAt : undefined

    return { items, nextCursor, totalCount }
  },
})

// Preview: first 3 root comments + their replies, for soul detail page
export const preview = query({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const soul = await ctx.db.get(args.soulId)
    const totalCount = soul?.stats.comments ?? 0

    const all = await ctx.db
      .query('comments')
      .withIndex('by_soul_created', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .take(100)

    const nonDeleted = all.filter((c) => !c.softDeletedAt)
    const roots = nonDeleted.filter((c) => !c.parentCommentId)
    const threeRootIds = new Set(roots.slice(0, 3).map((r) => r._id))
    const previewComments = nonDeleted.filter(
      (c) =>
        (!c.parentCommentId && threeRootIds.has(c._id)) ||
        (c.parentCommentId != null && threeRootIds.has(c.parentCommentId))
    )
    const items = await buildCommentResults(ctx, previewComments)

    return { items, totalCount }
  },
})

// Add a comment (optionally a reply to parentCommentId)
export const add = mutation({
  args: {
    soulId: v.id('souls'),
    body: v.string(),
    parentCommentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    if (user.commentsBannedAt) {
      throw new ConvexError('You are not allowed to comment.')
    }

    // Rate limit: max 5 comments per user per minute
    const recentComments = await ctx.db
      .query('comments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(10)
    const oneMinuteAgo = Date.now() - 60_000
    const commentsInLastMinute = recentComments.filter((c) => c.createdAt > oneMinuteAgo)
    if (commentsInLastMinute.length >= 5) {
      throw new ConvexError('Too many comments. Please wait a moment.')
    }

    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    const sanitized = sanitizeCommentBody(args.body)
    if (sanitized.error) {
      throw new ConvexError(sanitized.error)
    }
    const body = sanitized.body
    if (!body) {
      throw new ConvexError('Comment cannot be empty')
    }
    if (body.length > COMMENT_MAX_LENGTH) {
      throw new ConvexError('Comment too long')
    }

    const now = Date.now()

    const commentId = await ctx.db.insert('comments', {
      soulId: args.soulId,
      userId: user._id,
      body,
      parentCommentId: args.parentCommentId,
      createdAt: now,
    })

    // Update soul comment count
    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        comments: soul.stats.comments + 1,
      },
      updatedAt: now,
    })

    return { commentId }
  },
})

// Delete a comment (soft delete)
export const remove = mutation({
  args: { commentId: v.id('comments') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new ConvexError('Comment not found')
    }

    // Only author or admin can delete
    const isAdmin = user.role === 'admin' || user.role === 'moderator'
    if (comment.userId !== user._id && !isAdmin) {
      throw new ConvexError('Not authorized to delete this comment')
    }

    const now = Date.now()

    await ctx.db.patch(args.commentId, {
      softDeletedAt: now,
      deletedBy: user._id,
    })

    // Update soul comment count
    const soul = await ctx.db.get(comment.soulId)
    if (soul) {
      await ctx.db.patch(soul._id, {
        stats: {
          ...soul.stats,
          comments: Math.max(0, soul.stats.comments - 1),
        },
        updatedAt: now,
      })
    }

    return { success: true }
  },
})
