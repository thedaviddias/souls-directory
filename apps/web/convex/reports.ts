import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalAction, internalQuery, mutation } from './_generated/server'
import { getAuthenticatedUser } from './lib/access'

const REPORT_REASONS = ['spam', 'harassment', 'misinformation', 'other'] as const
const reportReasonValidator = v.union(
  v.literal('spam'),
  v.literal('harassment'),
  v.literal('misinformation'),
  v.literal('other')
)

/**
 * Internal query: get a report by id with related comment/soul for Slack payload.
 */
export const getReportWithTarget = internalQuery({
  args: { reportId: v.id('reports') },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId)
    if (!report) return null

    let soulSlug: string | null = null
    let soulName: string | null = null
    let commentBodySnippet: string | null = null

    if (report.commentId) {
      const comment = await ctx.db.get(report.commentId)
      if (comment) {
        commentBodySnippet = comment.body.slice(0, 200)
        if (comment.body.length > 200) commentBodySnippet += '…'
        const soul = await ctx.db.get(comment.soulId)
        if (soul) {
          soulSlug = soul.slug
          soulName = soul.name
        }
      }
    } else if (report.soulId) {
      const soul = await ctx.db.get(report.soulId)
      if (soul) {
        soulSlug = soul.slug
        soulName = soul.name
      }
    }

    const reporter = await ctx.db.get(report.userId)
    const reporterName = reporter?.displayName ?? reporter?.name ?? reporter?.handle ?? 'Unknown'

    return {
      reason: report.reason,
      details: report.details,
      reporterName,
      soulSlug,
      soulName,
      commentBodySnippet,
      isCommentReport: !!report.commentId,
    }
  },
})

/**
 * Internal action: POST report details to Slack moderation webhook.
 */
export const notifySlack = internalAction({
  args: { reportId: v.id('reports') },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.reports.getReportWithTarget, {
      reportId: args.reportId,
    })
    if (!data) return

    const webhookUrl = process.env.SLACK_MODERATION_WEBHOOK_URL
    if (!webhookUrl) return

    const targetDesc = data.isCommentReport
      ? `Comment on soul "${data.soulName ?? 'Unknown'}": ${data.commentBodySnippet ?? '(no body)'}`
      : `Soul "${data.soulName ?? 'Unknown'}"`

    const soulLink =
      data.soulSlug != null
        ? `https://souls.directory/souls/${encodeURIComponent(data.soulSlug)}`
        : '(no link)'

    const text = [
      '*New report*',
      `Reason: ${data.reason}`,
      data.details ? `Details: ${data.details}` : null,
      `Reported by: ${data.reporterName}`,
      `Target: ${targetDesc}`,
      `Link: ${soulLink}`,
    ]
      .filter(Boolean)
      .join('\n')

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  },
})

/**
 * Create a report (soul or comment). Auth required. Validates target exists.
 * Prevents duplicate: same user cannot report the same comment twice.
 * Schedules Slack notification.
 */
export const create = mutation({
  args: {
    soulId: v.optional(v.id('souls')),
    commentId: v.optional(v.id('comments')),
    reason: reportReasonValidator,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const hasSoul = args.soulId != null
    const hasComment = args.commentId != null
    if (hasSoul && hasComment) {
      throw new ConvexError('Report must target either a soul or a comment, not both.')
    }
    if (!hasSoul && !hasComment) {
      throw new ConvexError('Report must target a soul or a comment.')
    }

    const now = Date.now()

    if (args.commentId != null) {
      const commentId = args.commentId
      const comment = await ctx.db.get(commentId)
      if (!comment || comment.softDeletedAt) {
        throw new ConvexError('Comment not found')
      }
      const soul = await ctx.db.get(comment.soulId)
      if (!soul || soul.softDeletedAt) {
        throw new ConvexError('Soul not found')
      }

      // Prevent duplicate report from same user on same comment
      const existing = await ctx.db
        .query('reports')
        .withIndex('by_user_comment', (q) => q.eq('userId', user._id).eq('commentId', commentId))
        .first()
      if (existing) {
        throw new ConvexError('You have already reported this comment.')
      }

      const reportId = await ctx.db.insert('reports', {
        commentId: commentId,
        userId: user._id,
        reason: args.reason,
        details: args.details?.trim().slice(0, 500),
        status: 'pending',
        createdAt: now,
      })

      await ctx.scheduler.runAfter(0, internal.reports.notifySlack, { reportId })
      return { reportId }
    }

    // Soul report
    const soulId = args.soulId as Id<'souls'>
    const soul = await ctx.db.get(soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    const existingSoul = await ctx.db
      .query('reports')
      .withIndex('by_soul', (q) => q.eq('soulId', soulId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .first()
    if (existingSoul) {
      throw new ConvexError('You have already reported this soul.')
    }

    const reportId = await ctx.db.insert('reports', {
      soulId,
      userId: user._id,
      reason: args.reason,
      details: args.details?.trim().slice(0, 500),
      status: 'pending',
      createdAt: now,
    })

    await ctx.scheduler.runAfter(0, internal.reports.notifySlack, { reportId })
    return { reportId }
  },
})
