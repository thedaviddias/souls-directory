import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser, requireRole } from './lib/access'

// List all tags
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100)

    const tags = await ctx.db.query('tags').withIndex('by_slug').take(limit)

    return tags.map((tag) => ({
      _id: tag._id,
      slug: tag.slug,
      name: tag.name,
      description: tag.description,
    }))
  },
})

// Get a tag by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const tag = await ctx.db
      .query('tags')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug.toLowerCase()))
      .first()

    if (!tag) return null

    return {
      _id: tag._id,
      slug: tag.slug,
      name: tag.name,
      description: tag.description,
    }
  },
})

// Search tags by name (for autocomplete in upload form)
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 25)
    const searchQuery = args.query.trim().toLowerCase()

    if (!searchQuery) {
      // Return popular/recent tags when no query
      const tags = await ctx.db.query('tags').withIndex('by_slug').take(limit)
      return tags.map((tag) => ({
        _id: tag._id,
        slug: tag.slug,
        name: tag.name,
      }))
    }

    // Get all tags and filter (Convex doesn't have text search on tags)
    const allTags = await ctx.db.query('tags').withIndex('by_slug').collect()

    const matches = allTags
      .filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchQuery) ||
          tag.slug.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit)
      .map((tag) => ({
        _id: tag._id,
        slug: tag.slug,
        name: tag.name,
      }))

    return matches
  },
})

// Get an existing tag by name (for upload form)
// Users can only select existing tags - creation is restricted to admins
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim()
    if (!name) {
      return null
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (!slug) {
      return null
    }

    // Check if tag exists
    const existingTag = await ctx.db
      .query('tags')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (!existingTag) {
      return null
    }

    return {
      _id: existingTag._id,
      slug: existingTag.slug,
      name: existingTag.name,
    }
  },
})

// Get multiple tags by IDs
export const getByIds = query({
  args: { ids: v.array(v.id('tags')) },
  handler: async (ctx, args) => {
    const tags = await Promise.all(args.ids.map((id) => ctx.db.get(id)))

    return tags
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
      .map((tag) => ({
        _id: tag._id,
        slug: tag.slug,
        name: tag.name,
        description: tag.description,
      }))
  },
})

// Create a tag (admin/moderator only)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin or moderator role
    await requireRole(ctx, ['admin', 'moderator'])

    const name = args.name.trim()
    if (!name) {
      throw new ConvexError('Tag name is required')
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (!slug) {
      throw new ConvexError('Invalid tag name')
    }

    // Check if tag already exists
    const existingTag = await ctx.db
      .query('tags')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (existingTag) {
      throw new ConvexError('Tag already exists')
    }

    // Create new tag
    const now = Date.now()
    const tagId = await ctx.db.insert('tags', {
      slug,
      name,
      description: args.description?.trim(),
      createdAt: now,
    })

    return { _id: tagId, slug, name }
  },
})
