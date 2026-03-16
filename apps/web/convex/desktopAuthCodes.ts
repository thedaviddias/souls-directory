import { v } from 'convex/values'
import { mutation } from './_generated/server'

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Store an OAuth auth code for a desktop session.
 * Replaces any existing entry for the same session (handles retries).
 */
export const store = mutation({
  args: {
    session: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('desktopAuthCodes')
      .withIndex('by_session', (q) => q.eq('session', args.session))
      .first()
    if (existing) {
      await ctx.db.delete(existing._id)
    }
    await ctx.db.insert('desktopAuthCodes', {
      session: args.session,
      code: args.code,
      createdAt: Date.now(),
    })
  },
})

/**
 * Retrieve and delete the stored auth code (one-time retrieval).
 * Returns null if not found or expired.
 */
export const consume = mutation({
  args: {
    session: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query('desktopAuthCodes')
      .withIndex('by_session', (q) => q.eq('session', args.session))
      .first()

    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.createdAt > CODE_TTL_MS) {
      await ctx.db.delete(entry._id)
      return null
    }

    // One-time retrieval: delete after reading
    await ctx.db.delete(entry._id)
    return { code: entry.code }
  },
})
