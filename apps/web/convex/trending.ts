/**
 * Trending calculation logic
 *
 * Calculates trending scores for souls based on recent activity.
 * Uses time-decay weighting so recent activity counts more.
 */

import type { Id } from './_generated/dataModel'
import { internalMutation, internalQuery } from './_generated/server'

// Decay factor per day (0.8 means yesterday counts 80% as much as today)
const DECAY_FACTOR = 0.8
// Number of days to consider for trending
const TRENDING_WINDOW_DAYS = 7
// Weight multipliers for different activity types
const WEIGHTS = {
  downloads: 1,
  stars: 3, // Stars are more valuable signal
  views: 0.1,
}

/**
 * Calculate trending scores for all souls
 * Called by cron job every hour
 */
export const calculateTrendingScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const today = Math.floor(now / 86400000)
    const startDay = today - TRENDING_WINDOW_DAYS

    // Get all dailyStats from the last 7 days
    const recentStats = await ctx.db
      .query('dailyStats')
      .withIndex('by_day')
      .filter((q) => q.gte(q.field('day'), startDay))
      .collect()

    // Group stats by soulId and calculate weighted score
    const soulScores = new Map<string, number>()

    for (const stat of recentStats) {
      const daysAgo = today - stat.day
      const decayMultiplier = DECAY_FACTOR ** daysAgo

      // Calculate weighted activity score
      const activityScore =
        stat.downloads * WEIGHTS.downloads + stat.stars * WEIGHTS.stars + stat.views * WEIGHTS.views

      const weightedScore = activityScore * decayMultiplier

      const currentScore = soulScores.get(stat.soulId) ?? 0
      soulScores.set(stat.soulId, currentScore + weightedScore)
    }

    // Update trendingScore on each soul
    let updatedCount = 0
    for (const [soulId, score] of soulScores) {
      try {
        const soul = await ctx.db.get(soulId as Id<'souls'>)
        if (soul && !soul.softDeletedAt) {
          // Round to 2 decimal places for cleaner storage
          const roundedScore = Math.round(score * 100) / 100
          await ctx.db.patch(soulId as Id<'souls'>, {
            trendingScore: roundedScore,
            updatedAt: now,
          })
          updatedCount++
        }
      } catch {
        // Soul may have been deleted, skip
      }
    }

    // Also reset trendingScore for souls with no recent activity
    // This prevents old popular souls from staying at the top forever
    const allSouls = await ctx.db.query('souls').collect()
    for (const soul of allSouls) {
      if (!soulScores.has(soul._id) && soul.trendingScore && soul.trendingScore > 0) {
        // Apply decay to existing score if no recent activity
        const decayedScore = Math.round(soul.trendingScore * DECAY_FACTOR * 100) / 100
        if (decayedScore < 0.01) {
          await ctx.db.patch(soul._id, { trendingScore: 0, updatedAt: now })
        } else {
          await ctx.db.patch(soul._id, { trendingScore: decayedScore, updatedAt: now })
        }
      }
    }

    return { updatedCount, processedStats: recentStats.length }
  },
})

/**
 * Get hot souls - souls with high activity in the last hour
 * This is a query-time calculation for real-time "hot" ranking
 */
export const getHotSouls = internalQuery({
  args: {},
  handler: async (ctx) => {
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

    // Count downloads per soul for last hour
    const lastHourCounts = new Map<string, number>()
    for (const dl of recentDownloads) {
      const count = lastHourCounts.get(dl.soulId) ?? 0
      lastHourCounts.set(dl.soulId, count + 1)
    }

    // Count downloads per soul for previous hour
    const prevHourCounts = new Map<string, number>()
    for (const dl of previousDownloads) {
      const count = prevHourCounts.get(dl.soulId) ?? 0
      prevHourCounts.set(dl.soulId, count + 1)
    }

    // Calculate velocity (change from previous hour)
    const hotScores: Array<{ soulId: string; count: number; delta: number }> = []
    for (const [soulId, count] of lastHourCounts) {
      const prevCount = prevHourCounts.get(soulId) ?? 0
      const delta = count - prevCount
      hotScores.push({ soulId, count, delta })
    }

    // Sort by count (primary) and delta (secondary)
    hotScores.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return b.delta - a.delta
    })

    return hotScores
  },
})
