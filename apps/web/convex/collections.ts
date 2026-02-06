import { ConvexError, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getAuthenticatedUser, getCurrentUser } from './lib/access'

// List user's collections
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []

    const collections = await ctx.db
      .query('collections')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()

    return collections.map((col) => ({
      _id: col._id,
      slug: col.slug,
      name: col.name,
      description: col.description,
      isPublic: col.isPublic,
      coverImageUrl: col.coverImageUrl,
      soulCount: col.soulCount,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }))
  },
})

// List public collections
export const listPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)

    const collections = await ctx.db
      .query('collections')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .order('desc')
      .take(limit)

    const result: Array<{
      collection: {
        _id: Doc<'collections'>['_id']
        slug: string
        name: string
        description?: string
        coverImageUrl?: string
        soulCount: number
      }
      owner: {
        _id: Doc<'users'>['_id']
        handle?: string
        displayName?: string
        image?: string
      } | null
    }> = []

    for (const col of collections) {
      const owner = await ctx.db.get(col.ownerUserId)
      result.push({
        collection: {
          _id: col._id,
          slug: col.slug,
          name: col.name,
          description: col.description,
          coverImageUrl: col.coverImageUrl,
          soulCount: col.soulCount,
        },
        owner: owner
          ? {
              _id: owner._id,
              handle: owner.handle,
              displayName: owner.displayName,
              image: owner.image,
            }
          : null,
      })
    }

    return result
  },
})

// Get collection by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query('collections')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug.toLowerCase()))
      .first()

    if (!collection) return null

    // Check visibility
    const user = await getCurrentUser(ctx)
    const userId = user?._id ?? null

    if (!collection.isPublic && collection.ownerUserId !== userId) {
      return null
    }

    // Get owner
    const owner = await ctx.db.get(collection.ownerUserId)

    // Get collection items with souls
    const items = await ctx.db
      .query('collectionItems')
      .withIndex('by_collection', (q) => q.eq('collectionId', collection._id))
      .collect()

    const soulsWithNotes: Array<{
      soul: {
        _id: Doc<'souls'>['_id']
        slug: string
        ownerHandle: string | null
        name: string
        tagline: string
        stats: Doc<'souls'>['stats']
      } | null
      note?: string
      addedAt: number
    }> = []

    for (const item of items.sort((a, b) => a.order - b.order)) {
      const soul = await ctx.db.get(item.soulId)
      soulsWithNotes.push({
        soul:
          soul && !soul.softDeletedAt
            ? {
                _id: soul._id,
                slug: soul.slug,
                ownerHandle: soul.ownerHandle ?? null,
                name: soul.name,
                tagline: soul.tagline,
                stats: soul.stats,
              }
            : null,
        note: item.note,
        addedAt: item.createdAt,
      })
    }

    return {
      collection: {
        _id: collection._id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        coverImageUrl: collection.coverImageUrl,
        soulCount: collection.soulCount,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
      owner: owner
        ? {
            _id: owner._id,
            handle: owner.handle,
            displayName: owner.displayName,
            image: owner.image,
          }
        : null,
      souls: soulsWithNotes,
      isOwner: collection.ownerUserId === userId,
    }
  },
})

// Create a collection
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    // Generate slug from name
    const baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for existing slug and make unique
    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await ctx.db
        .query('collections')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const now = Date.now()

    const collectionId = await ctx.db.insert('collections', {
      slug,
      name: args.name,
      description: args.description,
      ownerUserId: user._id,
      isPublic: args.isPublic ?? false,
      soulCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    return { collectionId, slug }
  },
})

// Add soul to collection
export const addSoul = mutation({
  args: {
    collectionId: v.id('collections'),
    soulId: v.id('souls'),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const collection = await ctx.db.get(args.collectionId)
    if (!collection || collection.ownerUserId !== user._id) {
      throw new ConvexError('Collection not found or not owned by you')
    }

    const soul = await ctx.db.get(args.soulId)
    if (!soul || soul.softDeletedAt) {
      throw new ConvexError('Soul not found')
    }

    // Check if already in collection
    const existing = await ctx.db
      .query('collectionItems')
      .withIndex('by_collection_soul', (q) =>
        q.eq('collectionId', args.collectionId).eq('soulId', args.soulId)
      )
      .first()

    if (existing) {
      throw new ConvexError('Soul already in collection')
    }

    const now = Date.now()

    // Get max order
    const items = await ctx.db
      .query('collectionItems')
      .withIndex('by_collection', (q) => q.eq('collectionId', args.collectionId))
      .collect()
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) : 0

    await ctx.db.insert('collectionItems', {
      collectionId: args.collectionId,
      soulId: args.soulId,
      addedBy: user._id,
      order: maxOrder + 1,
      note: args.note,
      createdAt: now,
    })

    await ctx.db.patch(args.collectionId, {
      soulCount: collection.soulCount + 1,
      updatedAt: now,
    })

    return { success: true }
  },
})

// Remove soul from collection
export const removeSoul = mutation({
  args: {
    collectionId: v.id('collections'),
    soulId: v.id('souls'),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx)

    const collection = await ctx.db.get(args.collectionId)
    if (!collection || collection.ownerUserId !== user._id) {
      throw new ConvexError('Collection not found or not owned by you')
    }

    const item = await ctx.db
      .query('collectionItems')
      .withIndex('by_collection_soul', (q) =>
        q.eq('collectionId', args.collectionId).eq('soulId', args.soulId)
      )
      .first()

    if (!item) {
      throw new ConvexError('Soul not in collection')
    }

    await ctx.db.delete(item._id)

    await ctx.db.patch(args.collectionId, {
      soulCount: Math.max(0, collection.soulCount - 1),
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})
