/**
 * One-off migrations. Run with: npx convex run migrations:backfillSoulOwnerHandle
 */

import type { Doc } from './_generated/dataModel'
import { internalMutation } from './_generated/server'

/** Backfill ownerHandle on all souls from the owner user's handle. Run once after handle-scoped URLs. */
export const backfillSoulOwnerHandle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const souls = await ctx.db.query('souls').collect()
    let updated = 0
    for (const soul of souls) {
      if (soul.softDeletedAt) continue
      const owner = await ctx.db.get(soul.ownerUserId)
      if (!owner) continue
      const handle =
        (owner as Doc<'users'>).handle ??
        (owner as Doc<'users'>).githubHandle ??
        (owner as Doc<'users'> & { name?: string }).name
      if (!handle) continue
      const handleLower = handle.trim().toLowerCase()
      if (soul.ownerHandle === handleLower) continue
      await ctx.db.patch(soul._id, { ownerHandle: handleLower })
      updated += 1
    }
    return { total: souls.length, updated }
  },
})
