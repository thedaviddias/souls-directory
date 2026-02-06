/**
 * Soul mutations and user-specific queries.
 *
 * Split from souls.ts to stay under TypeScript's type instantiation
 * depth limit for Convex's FilterApi type resolution.
 */

import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser, getCurrentUser } from './lib/access'

// Upvote/un-upvote a soul
export const toggleUpvote = mutation({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    const existingUpvote = await ctx.db
      .query('upvotes')
      .withIndex('by_soul_user', (q) => q.eq('soulId', args.soulId).eq('userId', user._id))
      .first()

    const now = Date.now()

    if (existingUpvote) {
      await ctx.db.delete(existingUpvote._id)
      await ctx.db.patch(soul._id, {
        stats: {
          ...soul.stats,
          upvotes: Math.max(0, (soul.stats.upvotes ?? 0) - 1),
        },
        updatedAt: now,
      })
      return { upvoted: false }
    }

    await ctx.db.insert('upvotes', {
      soulId: args.soulId,
      userId: user._id,
      createdAt: now,
    })

    await ctx.db.patch(soul._id, {
      stats: {
        ...soul.stats,
        upvotes: (soul.stats.upvotes ?? 0) + 1,
      },
      updatedAt: now,
    })

    return { upvoted: true }
  },
})

// Check if user has upvoted a soul
export const isUpvoted = query({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return false

    const upvote = await ctx.db
      .query('upvotes')
      .withIndex('by_soul_user', (q) => q.eq('soulId', args.soulId).eq('userId', user._id))
      .first()

    return !!upvote
  },
})

// Helper to bump semver version
function bumpVersion(currentVersion: string, bumpType: 'major' | 'minor' | 'patch'): string {
  const parts = currentVersion.split('.').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return '1.0.1'
  }
  const [major, minor, patch] = parts
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

// Validate semver format
function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(version)
}

// List all versions of a soul
export const listVersions = query({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query('soulVersions')
      .withIndex('by_soul', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .collect()

    return versions
      .filter((v) => !v.softDeletedAt)
      .map((v) => ({
        _id: v._id,
        version: v.version,
        versionNumber: v.versionNumber,
        changelog: v.changelog,
        changelogSource: v.changelogSource,
        source: v.source,
        createdAt: v.createdAt,
      }))
  },
})

// Last N versions for soul detail page (version history section)
export const getVersionHistory = query({
  args: {
    soulId: v.id('souls'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 10)

    const versions = await ctx.db
      .query('soulVersions')
      .withIndex('by_soul', (q) => q.eq('soulId', args.soulId))
      .order('desc')
      .take(limit)

    return versions
      .filter((v) => !v.softDeletedAt)
      .map((v) => ({
        _id: v._id,
        version: v.version,
        versionNumber: v.versionNumber,
        changelog: v.changelog,
        createdAt: v.createdAt,
      }))
  },
})

// Get a specific version of a soul
export const getVersion = query({
  args: {
    soulId: v.id('souls'),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const versionDoc = await ctx.db
      .query('soulVersions')
      .withIndex('by_soul_version', (q) => q.eq('soulId', args.soulId).eq('version', args.version))
      .first()

    if (!versionDoc || versionDoc.softDeletedAt) return null

    return {
      _id: versionDoc._id,
      version: versionDoc.version,
      versionNumber: versionDoc.versionNumber,
      content: versionDoc.content,
      changelog: versionDoc.changelog,
      changelogSource: versionDoc.changelogSource,
      source: versionDoc.source,
      fingerprint: versionDoc.fingerprint,
      createdAt: versionDoc.createdAt,
    }
  },
})

// Publish a new soul or new version
export const publish = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    sha256: v.string(),
    categoryId: v.optional(v.id('categories')),
    tagIds: v.optional(v.array(v.id('tags'))),
    version: v.optional(v.string()),
    versionBump: v.optional(v.union(v.literal('major'), v.literal('minor'), v.literal('patch'))),
    changelog: v.optional(v.string()),
    source: v.optional(
      v.object({
        kind: v.union(v.literal('upload'), v.literal('github')),
        url: v.optional(v.string()),
        repo: v.optional(v.string()),
        ref: v.optional(v.string()),
        commit: v.optional(v.string()),
        path: v.optional(v.string()),
        importedAt: v.optional(v.number()),
      })
    ),
    forkedFromId: v.optional(v.id('souls')),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const slug = args.slug.trim().toLowerCase()
    if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      throw new ConvexError('Slug must be lowercase alphanumeric with dashes')
    }

    const ownerHandle =
      (user.handle ?? user.githubHandle ?? (user as { name?: string }).name ?? 'user')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'user'

    const existingSoul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', ownerHandle).eq('slug', slug))
      .first()

    if (existingSoul && existingSoul.ownerUserId !== user._id) {
      throw new ConvexError('This slug is already taken')
    }

    const now = Date.now()

    if (existingSoul) {
      const latestVersion = existingSoul.latestVersionId
        ? await ctx.db.get(existingSoul.latestVersionId)
        : null

      const currentVersionNumber = latestVersion?.versionNumber ?? 0
      const currentSemver = latestVersion?.version ?? '1.0.0'

      let newVersion: string
      if (args.version) {
        if (!isValidSemver(args.version)) {
          throw new ConvexError('Invalid version format. Use semver (e.g., 1.2.3)')
        }
        newVersion = args.version
      } else {
        const bumpType = args.versionBump ?? 'patch'
        newVersion = bumpVersion(currentSemver, bumpType)
      }

      const existingVersion = await ctx.db
        .query('soulVersions')
        .withIndex('by_soul_version', (q) =>
          q.eq('soulId', existingSoul._id).eq('version', newVersion)
        )
        .first()

      if (existingVersion) {
        throw new ConvexError(`Version ${newVersion} already exists`)
      }

      await ctx.db.patch(existingSoul._id, {
        name: args.name.trim(),
        tagline: args.tagline.trim(),
        description: args.description?.trim(),
        categoryId: args.categoryId,
        tagIds: args.tagIds,
        ...(existingSoul.ownerHandle ? {} : { ownerHandle: ownerHandle }),
        stats: {
          ...existingSoul.stats,
          versions: existingSoul.stats.versions + 1,
        },
        updatedAt: now,
      })

      const versionId = await ctx.db.insert('soulVersions', {
        soulId: existingSoul._id,
        version: newVersion,
        versionNumber: currentVersionNumber + 1,
        content: args.content,
        fingerprint: args.sha256,
        changelog: args.changelog?.trim() || 'Updated content',
        changelogSource: args.changelog ? 'user' : 'auto',
        source: args.source,
        createdBy: user._id,
        createdAt: now,
      })

      await ctx.db.patch(existingSoul._id, {
        latestVersionId: versionId,
      })

      return {
        soulId: existingSoul._id,
        versionId,
        version: newVersion,
        isNew: false,
        ownerHandle: existingSoul.ownerHandle ?? ownerHandle,
        slug,
      }
    }

    const soulId = await ctx.db.insert('souls', {
      slug,
      ownerHandle,
      name: args.name.trim(),
      tagline: args.tagline.trim(),
      description: args.description?.trim(),
      ownerUserId: user._id,
      categoryId: args.categoryId,
      tagIds: args.tagIds,
      latestVersionId: undefined,
      forkedFromId: args.forkedFromId,
      stats: { downloads: 0, stars: 0, upvotes: 0, versions: 1, comments: 0, views: 0 },
      featured: false,
      moderationStatus: 'active',
      createdAt: now,
      updatedAt: now,
    })

    const version = args.version && isValidSemver(args.version) ? args.version : '1.0.0'

    const versionId = await ctx.db.insert('soulVersions', {
      soulId,
      version,
      versionNumber: 1,
      content: args.content,
      fingerprint: args.sha256,
      changelog: args.changelog?.trim() || 'Initial version',
      changelogSource: args.changelog ? 'user' : 'auto',
      source: args.source,
      createdBy: user._id,
      createdAt: now,
    })

    await ctx.db.patch(soulId, {
      latestVersionId: versionId,
    })

    return { soulId, versionId, version, isNew: true, ownerHandle, slug }
  },
})

// Check if a slug is available (per-owner: unique within current user's namespace)
export const checkSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase()

    if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return { available: false, reason: 'Invalid format' }
    }

    const user = await getCurrentUser(ctx)
    if (!user) {
      return { available: true }
    }

    const ownerHandle =
      (user.handle ?? user.githubHandle ?? (user as { name?: string }).name ?? 'user')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'user'

    const existingSoul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', ownerHandle).eq('slug', slug))
      .first()

    if (!existingSoul) {
      return { available: true }
    }

    return { available: true, isOwner: true, currentVersion: existingSoul.stats.versions }
  },
})

// Delete a soul (soft delete) - only the owner can delete
export const deleteSoul = mutation({
  args: { soulId: v.id('souls') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const soul = await ctx.db.get(args.soulId)
    if (!soul) {
      throw new ConvexError('Soul not found')
    }

    if (soul.ownerUserId !== user._id) {
      throw new ConvexError('You do not have permission to delete this soul')
    }

    if (soul.softDeletedAt) {
      throw new ConvexError('Soul has already been deleted')
    }

    const now = Date.now()

    await ctx.db.patch(args.soulId, {
      softDeletedAt: now,
      updatedAt: now,
    })

    const versions = await ctx.db
      .query('soulVersions')
      .withIndex('by_soul', (q) => q.eq('soulId', args.soulId))
      .collect()

    for (const version of versions) {
      if (!version.softDeletedAt) {
        await ctx.db.patch(version._id, {
          softDeletedAt: now,
        })
      }
    }

    return { success: true }
  },
})

// Get soul data for editing (owner only)
export const getForEdit = query({
  args: { handle: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null

    const handleLower = args.handle.trim().toLowerCase()
    const slugLower = args.slug.trim().toLowerCase()
    const soul = await ctx.db
      .query('souls')
      .withIndex('by_owner_slug', (q) => q.eq('ownerHandle', handleLower).eq('slug', slugLower))
      .first()

    if (!soul || soul.softDeletedAt) return null
    if (soul.ownerUserId !== user._id) return null

    const latestVersion = soul.latestVersionId ? await ctx.db.get(soul.latestVersionId) : null

    const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null

    const tags = soul.tagIds ? await Promise.all(soul.tagIds.map((id) => ctx.db.get(id))) : []

    return {
      soul: {
        _id: soul._id,
        slug: soul.slug,
        name: soul.name,
        tagline: soul.tagline,
        description: soul.description,
        categoryId: soul.categoryId,
        tagIds: soul.tagIds,
        stats: soul.stats,
      },
      latestVersion: latestVersion
        ? {
            _id: latestVersion._id,
            version: latestVersion.version,
            versionNumber: latestVersion.versionNumber,
            content: latestVersion.content,
            changelog: latestVersion.changelog,
          }
        : null,
      category,
      tags: tags.filter(Boolean),
    }
  },
})

// List all souls for sitemap (public, minimal data)
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const souls = await ctx.db.query('souls').withIndex('by_updated').order('desc').collect()

    return souls
      .filter((soul) => !soul.softDeletedAt && soul.moderationStatus !== 'removed')
      .filter((soul) => soul.ownerHandle != null)
      .map((soul) => ({
        ownerHandle: soul.ownerHandle as string,
        slug: soul.slug,
        updatedAt: soul.updatedAt,
        createdAt: soul.createdAt,
      }))
  },
})

// List recent souls for RSS feed (with content excerpts)
export const listForFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)

    const souls = await ctx.db
      .query('souls')
      .withIndex('by_updated')
      .order('desc')
      .take(limit * 2)

    const items = []

    for (const soul of souls) {
      if (soul.softDeletedAt || soul.moderationStatus === 'removed') continue
      if (items.length >= limit) break

      const owner = await ctx.db.get(soul.ownerUserId)
      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      const latestVersion = soul.latestVersionId ? await ctx.db.get(soul.latestVersionId) : null

      items.push({
        ownerHandle: soul.ownerHandle ?? owner?.handle ?? owner?.githubHandle ?? '',
        slug: soul.slug,
        name: soul.name,
        tagline: soul.tagline,
        description: soul.description,
        contentExcerpt: latestVersion?.content?.slice(0, 500) || '',
        categoryName: category?.name,
        categorySlug: category?.slug,
        authorName: owner?.displayName || owner?.name || 'Anonymous',
        authorHandle: owner?.handle || owner?.githubHandle,
        createdAt: soul.createdAt,
        updatedAt: soul.updatedAt,
      })
    }

    return items
  },
})

// Update soul metadata only (no new version) - owner only
export const updateMetadata = mutation({
  args: {
    soulId: v.id('souls'),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.union(v.id('categories'), v.null())),
    tagIds: v.optional(v.array(v.id('tags'))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const soul = await ctx.db.get(args.soulId)
    if (!soul) {
      throw new ConvexError('Soul not found')
    }

    if (soul.ownerUserId !== user._id) {
      throw new ConvexError('You do not have permission to edit this soul')
    }

    if (soul.softDeletedAt) {
      throw new ConvexError('Soul has been deleted')
    }

    const now = Date.now()

    const updates: Record<string, unknown> = {
      updatedAt: now,
    }

    if (args.name !== undefined) {
      const name = args.name.trim()
      if (!name) {
        throw new ConvexError('Name cannot be empty')
      }
      updates.name = name
    }

    if (args.tagline !== undefined) {
      updates.tagline = args.tagline.trim()
    }

    if (args.description !== undefined) {
      updates.description = args.description.trim() || undefined
    }

    if (args.categoryId !== undefined) {
      updates.categoryId = args.categoryId ?? undefined
    }

    if (args.tagIds !== undefined) {
      updates.tagIds = args.tagIds.length > 0 ? args.tagIds : undefined
    }

    await ctx.db.patch(args.soulId, updates)

    return { success: true, soulId: args.soulId }
  },
})
