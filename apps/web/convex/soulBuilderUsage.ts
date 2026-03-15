import { v } from 'convex/values'
import { SOUL_BUILDER_DAILY_LIMIT } from '../lib/soul-builder'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser } from './lib/access'

function getUtcDateKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10)
}

function getNextUtcResetAt(now = Date.now()) {
  const next = new Date(now)
  next.setUTCHours(24, 0, 0, 0)
  return next.getTime()
}

export const getQuota = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)
    const dateKey = getUtcDateKey()
    const usage = await ctx.db
      .query('soulBuilderDailyUsage')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id).eq('dateKey', dateKey))
      .first()

    const used = usage?.count ?? 0

    return {
      used,
      limit: SOUL_BUILDER_DAILY_LIMIT,
      remaining: Math.max(SOUL_BUILDER_DAILY_LIMIT - used, 0),
      resetAt: getNextUtcResetAt(),
    }
  },
})

export const consume = mutation({
  args: {
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)
    const now = Date.now()
    const dateKey = getUtcDateKey(now)
    const amount = Math.max(args.amount ?? 1, 1)
    const usage = await ctx.db
      .query('soulBuilderDailyUsage')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id).eq('dateKey', dateKey))
      .first()

    const used = usage?.count ?? 0
    if (used >= SOUL_BUILDER_DAILY_LIMIT) {
      return {
        used,
        limit: SOUL_BUILDER_DAILY_LIMIT,
        remaining: 0,
        resetAt: getNextUtcResetAt(now),
      }
    }

    const nextUsed = Math.min(used + amount, SOUL_BUILDER_DAILY_LIMIT)

    if (usage) {
      await ctx.db.patch(usage._id, {
        count: nextUsed,
        lastGeneratedAt: now,
      })
    } else {
      await ctx.db.insert('soulBuilderDailyUsage', {
        userId: user._id,
        dateKey,
        count: nextUsed,
        lastGeneratedAt: now,
      })
    }

    return {
      used: nextUsed,
      limit: SOUL_BUILDER_DAILY_LIMIT,
      remaining: Math.max(SOUL_BUILDER_DAILY_LIMIT - nextUsed, 0),
      resetAt: getNextUtcResetAt(now),
    }
  },
})
