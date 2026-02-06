import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser, getCurrentUser } from './lib/access'

// Helper to create a public user profile (excludes sensitive fields)
function toPublicProfile(user: Doc<'users'>) {
  // Prefer handle, fall back to githubHandle, then name (often the GitHub login)
  const effectiveHandle = user.handle || user.githubHandle || user.name || null

  return {
    _id: user._id,
    handle: effectiveHandle,
    name: user.name,
    displayName: user.displayName,
    bio: user.bio,
    image: user.image,
    websiteUrl: user.websiteUrl,
    xHandle: user.xHandle ?? user.twitterHandle,
    mastodonHandle: user.mastodonHandle,
    blueskyHandle: user.blueskyHandle,
    githubHandle: user.githubHandle,
    role: user.role,
    createdAt: user.createdAt,
  }
}

// Helper to check if a user should be publicly visible
function isPubliclyVisible(user: Doc<'users'>): boolean {
  // Skip deleted users
  if (user.deletedAt) return false

  // User must have at least a handle or displayName to be listed
  const hasIdentity = !!(user.handle || user.displayName || user.name)

  return hasIdentity
}

// Helper to get soul count for a user
async function getUserSoulCount(ctx: QueryCtx, userId: Id<'users'>): Promise<number> {
  const souls = await ctx.db
    .query('souls')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', userId))
    .collect()

  return souls.filter((s) => !s.softDeletedAt).length
}

// Helper to generate a unique handle from a base name
async function generateUniqueHandle(ctx: MutationCtx, baseName: string): Promise<string> {
  // Sanitize: lowercase, alphanumeric and hyphens only
  let handle = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)

  if (!handle) {
    handle = 'user'
  }

  // Check if handle exists
  const existing = await ctx.db
    .query('users')
    .withIndex('handle', (q) => q.eq('handle', handle))
    .first()

  if (!existing) {
    return handle
  }

  // Add random suffix if taken
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${handle.slice(0, 25)}-${suffix}`
}

/**
 * Get the current authenticated user's full profile.
 * Returns null if not authenticated.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    return {
      ...toPublicProfile(user),
      // Include private fields for the user themselves
      email: user.email,
      githubId: user.githubId,
      githubCreatedAt: user.githubCreatedAt,
      updatedAt: user.updatedAt,
    }
  },
})

/**
 * Ensure user profile is complete after first login.
 * Called automatically by UserBootstrap component.
 *
 * Convex Auth already creates the user record with OAuth profile data (name, email, image).
 * This mutation adds our custom fields (handle, displayName, role, timestamps).
 */
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the Convex Auth user ID - this is directly in our users table
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError('Authentication required')
    }

    // Get the user record - Convex Auth already created it with OAuth profile data
    // Including GitHub fields from the createOrUpdateUser callback
    let user = await ctx.db.get(userId)
    if (!user) {
      // Edge case: auth account exists but user document was deleted
      // Return gracefully - client will handle re-auth
      throw new ConvexError(
        'User account data is missing. Please sign out and sign in again, or contact support if the issue persists.'
      )
    }

    const now = Date.now()
    const updates: Partial<Doc<'users'>> = {}

    // Backfill: extract GitHub username from avatar URL if githubHandle is missing
    // GitHub avatar URLs look like: https://avatars.githubusercontent.com/u/237229?v=4
    // We can't get the username from this, but we can use it as a signal that the user
    // signed in via GitHub. The githubHandle will be properly set on next re-auth.
    // For now, use the name field which was set from `profile.name || profile.login`.

    // Generate handle from name if not set
    if (!user.handle) {
      // Prefer GitHub handle, then name, then email prefix
      const baseName = user.githubHandle || user.name || user.email?.split('@')[0] || 'user'
      updates.handle = await generateUniqueHandle(ctx, baseName)
    }

    // Set displayName from name if not set
    if (!user.displayName && user.name) {
      updates.displayName = user.name
    }

    // Set default role if not set
    if (!user.role) {
      updates.role = 'user'
    }

    // Set timestamps if not set
    if (!user.createdAt) {
      updates.createdAt = now
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now
      await ctx.db.patch(user._id, updates)
      user = { ...user, ...updates }
    }

    return toPublicProfile(user)
  },
})

/**
 * Update the current user's profile.
 */
// Mastodon: user@instance.tld (optional leading @)
const MASTODON_HANDLE_REGEX = /^@?[a-zA-Z0-9_]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
// Bluesky: handle.bsky.social or custom domain
const BLUESKY_HANDLE_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
const SOCIAL_HANDLE_MAX_LENGTH = 100

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    xHandle: v.optional(v.string()),
    mastodonHandle: v.optional(v.string()),
    blueskyHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const updates: Partial<Doc<'users'>> = {
      updatedAt: Date.now(),
    }

    // Validate and set display name
    if (args.displayName !== undefined) {
      const name = args.displayName.trim()
      if (name.length > 50) {
        throw new ConvexError('Display name must be 50 characters or less')
      }
      updates.displayName = name || undefined
    }

    // Validate and set bio (strip Unicode control characters)
    if (args.bio !== undefined) {
      const bio = args.bio
        .trim()
        .split('')
        .filter((c) => {
          const code = c.charCodeAt(0)
          return code > 31 && (code < 127 || code > 159)
        })
        .join('')
      if (bio.length > 500) {
        throw new ConvexError('Bio must be 500 characters or less')
      }
      updates.bio = bio || undefined
    }

    // Validate and set website URL
    if (args.websiteUrl !== undefined) {
      const url = args.websiteUrl.trim()
      if (url && !isValidUrl(url)) {
        throw new ConvexError('Invalid website URL')
      }
      updates.websiteUrl = url || undefined
    }

    // Validate and set X handle
    if (args.xHandle !== undefined) {
      const handle = args.xHandle.trim().replace(/^@/, '')
      if (handle && !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
        throw new ConvexError('Invalid X handle')
      }
      updates.xHandle = handle || undefined
    }

    // Validate and set Mastodon handle (user@instance.tld)
    if (args.mastodonHandle !== undefined) {
      const raw = args.mastodonHandle.trim().replace(/^@/, '')
      if (raw) {
        const withAt = raw.includes('@') ? raw : `@${raw}`
        if (withAt.length > SOCIAL_HANDLE_MAX_LENGTH || !MASTODON_HANDLE_REGEX.test(withAt)) {
          throw new ConvexError('Invalid Mastodon handle (use format: user@instance.social)')
        }
        updates.mastodonHandle = raw
      } else {
        updates.mastodonHandle = undefined
      }
    }

    // Validate and set Bluesky handle (handle.bsky.social)
    if (args.blueskyHandle !== undefined) {
      const handle = args.blueskyHandle.trim().toLowerCase()
      if (handle) {
        if (handle.length > SOCIAL_HANDLE_MAX_LENGTH || !BLUESKY_HANDLE_REGEX.test(handle)) {
          throw new ConvexError('Invalid Bluesky handle (use format: handle.bsky.social)')
        }
        updates.blueskyHandle = handle
      } else {
        updates.blueskyHandle = undefined
      }
    }

    await ctx.db.patch(user._id, updates)

    const updatedUser = await ctx.db.get(user._id)
    return updatedUser ? toPublicProfile(updatedUser) : null
  },
})

/**
 * Get a user's public profile by handle, githubHandle, or user ID.
 */
export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const lookup = args.handle.toLowerCase()

    // 1. Try by handle (the common case)
    const byHandle = await ctx.db
      .query('users')
      .withIndex('handle', (q) => q.eq('handle', lookup))
      .first()

    if (byHandle && !byHandle.deletedAt) {
      return toPublicProfile(byHandle)
    }

    // 2. Try by githubHandle or name (GitHub login is often stored in name)
    const allUsers = await ctx.db.query('users').collect()
    const byGithubOrName = allUsers.find(
      (u) =>
        !u.deletedAt &&
        (u.githubHandle?.toLowerCase() === lookup || u.name?.toLowerCase() === lookup)
    )

    if (byGithubOrName) {
      return toPublicProfile(byGithubOrName)
    }

    // 3. Fallback: try by user ID (for links that use _id)
    try {
      const byId = await ctx.db.get(args.handle as Id<'users'>)
      if (byId && !byId.deletedAt) {
        return toPublicProfile(byId)
      }
    } catch {
      // Invalid ID format, ignore
    }

    return null
  },
})

/**
 * Get souls owned by a user.
 */
export const getSoulsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)

    const user = await ctx.db.get(args.userId)
    const souls = await ctx.db
      .query('souls')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', args.userId))
      .order('desc')
      .take(limit)

    // Filter out deleted souls and map to public format
    const items = []
    for (const soul of souls) {
      if (soul.softDeletedAt) continue

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null

      items.push({
        soul: {
          _id: soul._id,
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? user?.handle ?? user?.githubHandle,
          name: soul.name,
          tagline: soul.tagline,
          stats: soul.stats,
          featured: soul.featured,
          createdAt: soul.createdAt,
          updatedAt: soul.updatedAt,
        },
        category,
      })
    }

    return items
  },
})

/**
 * Get souls owned by the current user (for dashboard).
 */
export const getMySouls = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const limit = Math.min(args.limit ?? 20, 50)

    const souls = await ctx.db
      .query('souls')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .order('desc')
      .take(limit)

    const items = []
    for (const soul of souls) {
      if (soul.softDeletedAt) continue

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null

      items.push({
        soul: {
          _id: soul._id,
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? user.handle ?? user.githubHandle,
          name: soul.name,
          tagline: soul.tagline,
          stats: soul.stats,
          featured: soul.featured,
          createdAt: soul.createdAt,
          updatedAt: soul.updatedAt,
        },
        category,
      })
    }

    return items
  },
})

/**
 * Get souls starred by the current user.
 */
export const getMyStarredSouls = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const limit = Math.min(args.limit ?? 20, 50)

    const stars = await ctx.db
      .query('stars')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit)

    const items = []
    for (const star of stars) {
      const soul = await ctx.db.get(star.soulId)
      if (!soul || soul.softDeletedAt) continue

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null

      items.push({
        soul: {
          _id: soul._id,
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? user.handle ?? user.githubHandle,
          name: soul.name,
          tagline: soul.tagline,
          stats: soul.stats,
          featured: soul.featured,
          createdAt: soul.createdAt,
          updatedAt: soul.updatedAt,
        },
        category,
        starredAt: star.createdAt,
      })
    }

    return items
  },
})

/**
 * Soft delete the current user's account.
 * This marks the account as deleted, clears personal info, and anonymizes their content.
 *
 * Content handling:
 * - Souls remain public but are attributed to "Deleted User"
 * - Comments remain visible but author is anonymized
 * - Stars and other engagement data is preserved for statistics
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx)

    const now = Date.now()

    // 1. Soft delete the user and clear personal identifiable information
    await ctx.db.patch(user._id, {
      deletedAt: now,
      // Clear all personal/identifiable info
      name: undefined,
      displayName: undefined,
      email: undefined,
      bio: undefined,
      websiteUrl: undefined,
      xHandle: undefined,
      githubHandle: undefined,
      image: undefined,
      // Keep handle but prefix with "deleted-" for uniqueness
      handle: user.handle ? `deleted-${user.handle}-${now}` : `deleted-user-${now}`,
      updatedAt: now,
    })

    // 2. Souls: Keep them public but they'll show as owned by deleted user
    // No changes needed - the UI will handle showing "Deleted User" for deleted accounts
    // The ownerUserId remains the same for referential integrity

    // 3. Comments: Keep them visible but anonymized
    // No changes needed - comments remain linked to user ID
    // The UI will show "Deleted User" based on the deletedAt timestamp

    // 4. Collections: Soft delete user's collections
    const userCollections = await ctx.db
      .query('collections')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()

    // Note: We don't delete collections, just leave them orphaned
    // In the future, we could add a cleanup job or soft-delete flag

    // 5. Audit log the deletion
    await ctx.db.insert('auditLogs', {
      actorUserId: user._id,
      action: 'account_deleted',
      targetType: 'users',
      targetId: user._id,
      metadata: {
        email: user.email, // Log email for audit trail
        deletedAt: now,
      },
      createdAt: now,
    })

    return {
      success: true,
      message: 'Account deleted. Your content has been anonymized.',
    }
  },
})

// URL validation helper with stricter checks
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // Must be HTTP or HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    // Must have a valid hostname (not empty, not just dots)
    if (!url.hostname || url.hostname === '.' || url.hostname.startsWith('.')) {
      return false
    }

    // Block localhost and private IPs for security (IPv4 and IPv6)
    const hostname = url.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) {
      return false
    }
    // IPv6: link-local, unique local, IPv4-mapped
    if (
      hostname.startsWith('[fe80:') ||
      hostname.startsWith('[fc00:') ||
      hostname.startsWith('[fd') ||
      hostname.startsWith('[::ffff:')
    ) {
      return false
    }

    // Hostname must contain at least one dot (basic TLD check)
    if (!url.hostname.includes('.')) {
      return false
    }

    // Max URL length for sanity
    if (urlString.length > 2048) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * List all public members with pagination and optional search.
 * Returns users who have made their profiles public with basic activity stats.
 */
export const listMembers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sort: v.optional(v.union(v.literal('recent'), v.literal('active'))),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, 100)
    const sort = args.sort ?? 'recent'

    // Get all users sorted by creation time descending
    const allUsers = await ctx.db.query('users').order('desc').collect()

    // Filter to only publicly visible users
    let visibleUsers = allUsers.filter(isPubliclyVisible)

    // Apply search filter
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim()
      visibleUsers = visibleUsers.filter((user) => {
        const displayName = (user.displayName || user.name || '').toLowerCase()
        const handle = (user.handle || '').toLowerCase()
        const bio = (user.bio || '').toLowerCase()

        return (
          displayName.includes(searchLower) ||
          handle.includes(searchLower) ||
          bio.includes(searchLower)
        )
      })
    }

    // Get soul counts for all visible users in parallel
    const userIds = visibleUsers.map((u) => u._id)
    const soulCounts = await Promise.all(userIds.map((id) => getUserSoulCount(ctx, id)))

    // Map soul counts to users
    const usersWithStats = visibleUsers.map((user, idx) => ({
      ...toPublicProfile(user),
      soulCount: soulCounts[idx],
    }))

    // Sort by activity (soul count) if requested
    if (sort === 'active') {
      usersWithStats.sort((a, b) => (b.soulCount || 0) - (a.soulCount || 0))
    }

    // Apply cursor-based pagination
    let startIndex = 0
    if (args.cursor) {
      const cursorIndex = usersWithStats.findIndex((u) => u._id === args.cursor)
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1
      }
    }

    const paginatedUsers = usersWithStats.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < usersWithStats.length
    const nextCursor = hasMore ? paginatedUsers[paginatedUsers.length - 1]?._id : null

    return {
      members: paginatedUsers,
      totalCount: usersWithStats.length,
      hasMore,
      nextCursor,
    }
  },
})

/**
 * Get total count of public members (for metadata/stats).
 */
export const getMemberCount = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query('users').collect()
    const visibleUsers = allUsers.filter(isPubliclyVisible)
    return visibleUsers.length
  },
})

/**
 * List all public user handles for sitemap generation.
 */
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query('users').collect()

    return allUsers
      .filter(isPubliclyVisible)
      .map((user) => ({
        handle: user.handle || user.githubHandle || user.name,
        updatedAt: user.updatedAt || user.createdAt,
      }))
      .filter((u): u is { handle: string; updatedAt: number | undefined } => !!u.handle)
  },
})

/**
 * One-time migration: copy twitterHandle to xHandle for all users.
 * Run with: npx convex run users:migrateTwitterHandleToXHandle
 * After running, remove twitterHandle from schema and the fallback in toPublicProfile.
 */
export const migrateTwitterHandleToXHandle = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    let updated = 0
    for (const user of users) {
      const legacy = (user as { twitterHandle?: string }).twitterHandle
      if (legacy && !user.xHandle) {
        await ctx.db.patch(user._id, { xHandle: legacy })
        updated += 1
      }
    }
    return { total: users.length, updated }
  },
})
