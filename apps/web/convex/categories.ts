import { v } from 'convex/values'
import { query } from './_generated/server'

// List all categories
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').withIndex('by_order').collect()

    return categories.map((cat) => ({
      _id: cat._id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      order: cat.order,
    }))
  },
})

// List all categories with soul counts
export const listWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').withIndex('by_order').collect()

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const souls = await ctx.db
          .query('souls')
          .withIndex('by_category', (q) => q.eq('categoryId', cat._id))
          .collect()

        const soulCount = souls.filter((s) => !s.softDeletedAt).length

        return {
          _id: cat._id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
          soulCount,
        }
      })
    )

    return categoriesWithCounts
  },
})

// Get category by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug.toLowerCase()))
      .first()

    if (!category) return null

    // Get soul count for this category
    const souls = await ctx.db
      .query('souls')
      .withIndex('by_category', (q) => q.eq('categoryId', category._id))
      .collect()

    const soulCount = souls.filter((s) => !s.softDeletedAt).length

    return {
      _id: category._id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      soulCount,
    }
  },
})
