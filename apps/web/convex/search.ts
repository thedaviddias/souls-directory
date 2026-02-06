import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { action, query } from './_generated/server'

// Autocomplete search for header - lightweight, fast results
export const searchAutocomplete = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 8, 15)
    const searchQuery = args.query.trim()

    if (!searchQuery || searchQuery.length < 2) {
      return { souls: [], categories: [] }
    }

    // Use Convex search indexes for name search
    const nameResults = await ctx.db
      .query('souls')
      .withSearchIndex('search_name', (q) =>
        q.search('name', searchQuery).eq('moderationStatus', 'active')
      )
      .take(limit)

    // Use Convex search indexes for tagline search
    const taglineResults = await ctx.db
      .query('souls')
      .withSearchIndex('search_tagline', (q) =>
        q.search('tagline', searchQuery).eq('moderationStatus', 'active')
      )
      .take(limit)

    // Deduplicate and merge results
    const seenIds = new Set<Id<'souls'>>()
    const souls: Array<{
      _id: Id<'souls'>
      slug: string
      ownerHandle: string | null
      name: string
      tagline: string
      categorySlug: string | null
      categoryName: string | null
    }> = []

    for (const soul of [...nameResults, ...taglineResults]) {
      if (soul.softDeletedAt || seenIds.has(soul._id)) continue
      if (souls.length >= limit) break
      seenIds.add(soul._id)

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      souls.push({
        _id: soul._id,
        slug: soul.slug,
        ownerHandle: soul.ownerHandle ?? null,
        name: soul.name,
        tagline: soul.tagline,
        categorySlug: category?.slug ?? null,
        categoryName: category?.name ?? null,
      })
    }

    // Also search categories for "Browse {Category}" suggestions
    const allCategories = await ctx.db.query('categories').withIndex('by_order').collect()
    const lowerQuery = searchQuery.toLowerCase()
    const categories = allCategories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(lowerQuery) || cat.slug.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
      }))

    return { souls, categories }
  },
})

// Full text search (keeps existing functionality)
export const searchSouls = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    categorySlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)
    const searchQuery = args.query.trim()

    if (!searchQuery) return []

    // Get category ID if filtering
    let categoryId: Id<'categories'> | undefined
    if (args.categorySlug) {
      const slug = args.categorySlug
      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
      categoryId = category?._id
    }

    // Use search indexes when available
    const nameResults = await ctx.db
      .query('souls')
      .withSearchIndex('search_name', (q) => {
        let search = q.search('name', searchQuery).eq('moderationStatus', 'active')
        if (categoryId) {
          search = search.eq('categoryId', categoryId)
        }
        return search
      })
      .take(limit * 2)

    const taglineResults = await ctx.db
      .query('souls')
      .withSearchIndex('search_tagline', (q) => {
        let search = q.search('tagline', searchQuery).eq('moderationStatus', 'active')
        if (categoryId) {
          search = search.eq('categoryId', categoryId)
        }
        return search
      })
      .take(limit * 2)

    // Dedupe and merge with scoring
    const seenIds = new Set<Id<'souls'>>()
    const matches: Array<{
      soul: {
        _id: Doc<'souls'>['_id']
        slug: string
        ownerHandle: string | null
        name: string
        tagline: string
        description?: string
        stats: Doc<'souls'>['stats']
      }
      category: Doc<'categories'> | null
      score: number
    }> = []

    const lowerQuery = searchQuery.toLowerCase()

    // Process name results (higher score)
    for (const soul of nameResults) {
      if (soul.softDeletedAt || seenIds.has(soul._id)) continue
      seenIds.add(soul._id)

      let score = 50 // Base score for name match
      const name = soul.name.toLowerCase()
      if (name === lowerQuery) score += 100
      else if (name.startsWith(lowerQuery)) score += 50

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      matches.push({
        soul: {
          _id: soul._id,
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? null,
          name: soul.name,
          tagline: soul.tagline,
          description: soul.description,
          stats: soul.stats,
        },
        category,
        score,
      })
    }

    // Process tagline results (lower score)
    for (const soul of taglineResults) {
      if (soul.softDeletedAt || seenIds.has(soul._id)) continue
      seenIds.add(soul._id)

      const category = soul.categoryId ? await ctx.db.get(soul.categoryId) : null
      matches.push({
        soul: {
          _id: soul._id,
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? null,
          name: soul.name,
          tagline: soul.tagline,
          description: soul.description,
          stats: soul.stats,
        },
        category,
        score: 25, // Lower score for tagline match
      })
    }

    // Sort by score and return
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ soul, category }) => ({ soul, category }))
  },
})

// Vector search placeholder (will implement with OpenAI embeddings)
export const semanticSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Generate embedding for query using OpenAI
    // TODO: Search soulEmbeddings using vectorSearch
    // For now, fall back to text search
    return []
  },
})
