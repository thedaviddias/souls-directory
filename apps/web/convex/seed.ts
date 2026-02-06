import { v } from 'convex/values'
import { internalMutation, mutation } from './_generated/server'

/**
 * Category definitions for seeding.
 * Icons are stored as slug identifiers - the UI maps these to Lucide icons.
 * This matches the centralized config in lib/categories.ts
 */
/**
 * Consolidated categories (reduced from 15 to 8 to avoid overlap).
 *
 * Merges:
 * - Technical absorbed Coding
 * - Professional absorbed Productivity, Support, Tools
 * - Creative absorbed Communication
 * - Educational absorbed Learning
 * - Playful absorbed Fun
 */
const SEED_CATEGORIES = [
  {
    slug: 'technical',
    name: 'Technical',
    description: 'Engineering, DevOps, security, and developer tools',
    icon: 'technical',
    color: '#00d9ff',
    order: 1,
  },
  {
    slug: 'professional',
    name: 'Professional',
    description: 'Business, workplace, planning, and workflow',
    icon: 'professional',
    color: '#3ddc84',
    order: 2,
  },
  {
    slug: 'creative',
    name: 'Creative',
    description: 'Writers, artists, copywriters, and translators',
    icon: 'creative',
    color: '#bf5af2',
    order: 3,
  },
  {
    slug: 'educational',
    name: 'Educational',
    description: 'Teachers, tutors, study guides, and mentors',
    icon: 'educational',
    color: '#ff6b6b',
    order: 4,
  },
  {
    slug: 'playful',
    name: 'Playful',
    description: 'Games, entertainment, and quirky characters',
    icon: 'playful',
    color: '#ffcc02',
    order: 5,
  },
  {
    slug: 'wellness',
    name: 'Wellness',
    description: 'Mindful, supportive, and empathetic companions',
    icon: 'wellness',
    color: '#10b981',
    order: 6,
  },
  {
    slug: 'research',
    name: 'Research',
    description: 'Analysis, fact-checking, and investigation',
    icon: 'research',
    color: '#f59e0b',
    order: 7,
  },
  {
    slug: 'experimental',
    name: 'Experimental',
    description: 'Novel, unconventional, and boundary-pushing',
    icon: 'experimental',
    color: '#06b6d4',
    order: 8,
  },
]

// Seed categories (only runs if no categories exist)
export const seedCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('categories').first()
    if (existing) {
      console.log('Categories already seeded')
      return
    }

    const now = Date.now()

    for (const cat of SEED_CATEGORIES) {
      await ctx.db.insert('categories', { ...cat, createdAt: now, updatedAt: now })
    }

    console.log(`Seeded ${SEED_CATEGORIES.length} categories`)
  },
})

// Sync categories - adds missing categories and updates existing ones
export const syncCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let added = 0
    let updated = 0

    for (const cat of SEED_CATEGORIES) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', cat.slug))
        .first()

      if (existing) {
        // Update existing category
        await ctx.db.patch(existing._id, {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
          updatedAt: now,
        })
        updated++
      } else {
        // Add new category
        await ctx.db.insert('categories', { ...cat, createdAt: now, updatedAt: now })
        added++
      }
    }

    console.log(`Categories synced: ${added} added, ${updated} updated`)
    return { added, updated }
  },
})

// Admin: Sync categories (public mutation - can be called from dashboard or client)
// This adds missing categories and updates existing ones to match the centralized config
export const adminSyncCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let added = 0
    let updated = 0

    for (const cat of SEED_CATEGORIES) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', cat.slug))
        .first()

      if (existing) {
        // Update existing category
        await ctx.db.patch(existing._id, {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
          updatedAt: now,
        })
        updated++
      } else {
        // Add new category
        await ctx.db.insert('categories', { ...cat, createdAt: now, updatedAt: now })
        added++
      }
    }

    return { success: true, added, updated, total: SEED_CATEGORIES.length }
  },
})

/**
 * Category consolidation migration.
 *
 * Maps deprecated categories to their new consolidated equivalents:
 * - coding -> technical
 * - productivity -> professional
 * - communication -> creative
 * - learning -> educational
 * - fun -> playful
 * - support -> professional
 * - tools -> professional
 *
 * Run with: npx convex run --no-push seed:migrateCategories
 */
const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  coding: 'technical',
  productivity: 'professional',
  communication: 'creative',
  learning: 'educational',
  fun: 'playful',
  support: 'professional',
  tools: 'professional',
}

export const migrateCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stats = {
      soulsUpdated: 0,
      categoriesDeleted: 0,
      errors: [] as string[],
    }

    // Get all categories
    const allCategories = await ctx.db.query('categories').collect()
    const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]))

    // Process each deprecated category
    for (const [oldSlug, newSlug] of Object.entries(CATEGORY_MIGRATION_MAP)) {
      const oldCategory = categoryBySlug.get(oldSlug)
      const newCategory = categoryBySlug.get(newSlug)

      if (!oldCategory) {
        // Old category doesn't exist, skip
        continue
      }

      if (!newCategory) {
        stats.errors.push(`Target category "${newSlug}" not found for migration from "${oldSlug}"`)
        continue
      }

      // Find all souls with the old category
      const soulsToMigrate = await ctx.db
        .query('souls')
        .withIndex('by_category', (q) => q.eq('categoryId', oldCategory._id))
        .collect()

      // Update each soul to use the new category
      for (const soul of soulsToMigrate) {
        await ctx.db.patch(soul._id, {
          categoryId: newCategory._id,
          updatedAt: Date.now(),
        })
        stats.soulsUpdated++
      }

      // Delete the old category
      await ctx.db.delete(oldCategory._id)
      stats.categoriesDeleted++
      console.log(`Migrated ${soulsToMigrate.length} souls from "${oldSlug}" to "${newSlug}"`)
    }

    console.log(
      `Migration complete: ${stats.soulsUpdated} souls updated, ${stats.categoriesDeleted} categories deleted`
    )
    if (stats.errors.length > 0) {
      console.error('Errors:', stats.errors)
    }

    return stats
  },
})

/**
 * Preview seed — public mutation for use with `npx convex deploy --preview-run`.
 *
 * Seeds categories and tags in a single call so preview deployments start
 * with the minimum data needed to render pages without 500 errors.
 *
 * Safe to call multiple times — skips if data already exists.
 */
export const seedPreview = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let catCount = 0
    let tagCount = 0

    // Seed categories if empty
    const existingCat = await ctx.db.query('categories').first()
    if (!existingCat) {
      for (const cat of SEED_CATEGORIES) {
        await ctx.db.insert('categories', { ...cat, createdAt: now, updatedAt: now })
        catCount++
      }
    }

    // Seed tags if empty
    const existingTag = await ctx.db.query('tags').first()
    if (!existingTag) {
      const tags = [
        { slug: 'coding', name: 'Coding' },
        { slug: 'writing', name: 'Writing' },
        { slug: 'productivity', name: 'Productivity' },
        { slug: 'debugging', name: 'Debugging' },
        { slug: 'creative', name: 'Creative' },
        { slug: 'education', name: 'Education' },
        { slug: 'fun', name: 'Fun' },
        { slug: 'business', name: 'Business' },
        { slug: 'ai', name: 'AI' },
        { slug: 'chat', name: 'Chat' },
        { slug: 'assistant', name: 'Assistant' },
        { slug: 'mentor', name: 'Mentor' },
        { slug: 'coach', name: 'Coach' },
        { slug: 'developer', name: 'Developer' },
        { slug: 'design', name: 'Design' },
        { slug: 'data', name: 'Data' },
        { slug: 'devops', name: 'DevOps' },
        { slug: 'security', name: 'Security' },
        { slug: 'wellness', name: 'Wellness' },
        { slug: 'gaming', name: 'Gaming' },
      ]
      for (const tag of tags) {
        await ctx.db.insert('tags', { ...tag, createdAt: now })
        tagCount++
      }
    }

    console.log(`Preview seed: ${catCount} categories, ${tagCount} tags`)
    return { categories: catCount, tags: tagCount }
  },
})

// Seed tags
export const seedTags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('tags').first()
    if (existing) {
      console.log('Tags already seeded')
      return
    }

    const now = Date.now()
    const tags = [
      { slug: 'coding', name: 'Coding' },
      { slug: 'writing', name: 'Writing' },
      { slug: 'productivity', name: 'Productivity' },
      { slug: 'debugging', name: 'Debugging' },
      { slug: 'creative', name: 'Creative' },
      { slug: 'education', name: 'Education' },
      { slug: 'fun', name: 'Fun' },
      { slug: 'business', name: 'Business' },
      { slug: 'ai', name: 'AI' },
      { slug: 'chat', name: 'Chat' },
      { slug: 'assistant', name: 'Assistant' },
      { slug: 'mentor', name: 'Mentor' },
      { slug: 'coach', name: 'Coach' },
      { slug: 'developer', name: 'Developer' },
      { slug: 'design', name: 'Design' },
      { slug: 'data', name: 'Data' },
      { slug: 'devops', name: 'DevOps' },
      { slug: 'security', name: 'Security' },
      { slug: 'wellness', name: 'Wellness' },
      { slug: 'gaming', name: 'Gaming' },
    ]

    for (const tag of tags) {
      await ctx.db.insert('tags', { ...tag, createdAt: now })
    }

    console.log(`Seeded ${tags.length} tags`)
  },
})

// Seed initial souls (run after categories)
export const seedSouls = internalMutation({
  args: { adminUserId: v.id('users') },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('souls').first()
    if (existing) {
      console.log('Souls already seeded')
      return
    }

    // Get categories
    const categories = await ctx.db.query('categories').collect()
    const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]))

    const now = Date.now()

    const souls = [
      {
        slug: 'stark',
        name: 'Stark',
        tagline: 'Sharp wit, clean code, no nonsense',
        description:
          'A senior engineer who values precision and efficiency. Cuts through complexity with elegant solutions.',
        categoryId: catMap.coding,
        content: `# SOUL.md - Stark

You are Stark, a senior engineer with decades of experience. You value:
- Clean, maintainable code
- Clear communication
- Efficient solutions
- No unnecessary complexity

When helping with code, you:
1. Understand the problem first
2. Propose the simplest solution
3. Explain your reasoning
4. Suggest improvements

You're direct but not rude. You respect the user's time.`,
        featured: true,
        testedWithModels: [
          { model: 'claude-3-opus', provider: 'anthropic', testedAt: now },
          { model: 'gpt-4o', provider: 'openai', testedAt: now },
        ],
      },
      {
        slug: 'muse',
        name: 'Muse',
        tagline: 'Your creative writing partner',
        description: 'A thoughtful collaborator for stories, poetry, and creative projects.',
        categoryId: catMap.creative,
        content: `# SOUL.md - Muse

You are Muse, a creative writing partner. You help with:
- Story development and plotting
- Character creation
- Dialogue and voice
- Poetry and prose

You ask thoughtful questions to understand the vision.
You offer suggestions, not mandates.
You celebrate creativity and experimentation.`,
        featured: true,
        testedWithModels: [{ model: 'claude-3-opus', provider: 'anthropic', testedAt: now }],
      },
      {
        slug: 'coach',
        name: 'Coach',
        tagline: 'Structured thinking for complex problems',
        description: 'Helps break down overwhelming tasks into manageable steps.',
        categoryId: catMap.productivity,
        content: `# SOUL.md - Coach

You are Coach, a productivity partner. You help by:
- Breaking large tasks into small steps
- Setting realistic timelines
- Identifying blockers early
- Celebrating progress

You're encouraging but realistic.
You focus on action over perfection.`,
        featured: true,
        testedWithModels: [{ model: 'claude-3-sonnet', provider: 'anthropic', testedAt: now }],
      },
      {
        slug: 'sage',
        name: 'Sage',
        tagline: 'Patient teacher, curious learner',
        description: 'Explains complex topics with clarity and patience.',
        categoryId: catMap.learning,
        content: `# SOUL.md - Sage

You are Sage, an educator at heart. You:
- Explain concepts from first principles
- Use analogies and examples
- Check understanding frequently
- Adapt to the learner's level

Never condescend. Always curious.
Learning is a journey you take together.`,
        featured: false,
        testedWithModels: [],
      },
      {
        slug: 'jester',
        name: 'Jester',
        tagline: 'Wit, wordplay, and occasional wisdom',
        description: 'Brings levity to conversations while still being genuinely helpful.',
        categoryId: catMap.fun,
        content: `# SOUL.md - Jester

You are Jester, the clever companion. You:
- Find humor in unexpected places
- Use puns and wordplay (sparingly)
- Keep things light without being annoying
- Know when to be serious

Entertainment AND utility. Why choose?`,
        featured: false,
        testedWithModels: [],
      },
      {
        slug: 'exec',
        name: 'Exec',
        tagline: 'Executive assistant, always prepared',
        description: 'Professional, organized, anticipates needs before you ask.',
        categoryId: catMap.professional,
        content: `# SOUL.md - Exec

You are Exec, a world-class executive assistant. You:
- Anticipate needs and prepare ahead
- Communicate concisely and professionally
- Manage complexity behind the scenes
- Never drop the ball

Proactive, not reactive. Always one step ahead.`,
        featured: true,
        testedWithModels: [
          { model: 'claude-3-opus', provider: 'anthropic', testedAt: now },
          { model: 'gpt-4o', provider: 'openai', testedAt: now },
        ],
      },
      {
        slug: 'reviewer',
        name: 'Reviewer',
        tagline: 'Thorough code review, constructive feedback',
        description: 'Reviews code like a senior engineer who actually wants you to grow.',
        categoryId: catMap.coding,
        content: `# SOUL.md - Reviewer

You are Reviewer, the code review specialist. You:
- Review code thoroughly but kindly
- Explain WHY something should change
- Acknowledge good patterns
- Suggest alternatives, not just problems

The goal is better code AND a better developer.`,
        featured: false,
        testedWithModels: [],
      },
      {
        slug: 'debugger',
        name: 'Debugger',
        tagline: 'Systematic problem solver',
        description: 'Approaches bugs methodically, never guesses randomly.',
        categoryId: catMap.coding,
        content: `# SOUL.md - Debugger

You are Debugger, the systematic investigator. You:
- Reproduce the issue first
- Form hypotheses
- Test systematically
- Document findings

No random guessing. Evidence-based debugging only.`,
        featured: false,
        testedWithModels: [],
      },
    ]

    for (const soul of souls) {
      // Create soul
      const soulId = await ctx.db.insert('souls', {
        slug: soul.slug,
        name: soul.name,
        tagline: soul.tagline,
        description: soul.description,
        ownerUserId: args.adminUserId,
        categoryId: soul.categoryId,
        testedWithModels: soul.testedWithModels,
        featured: soul.featured,
        trendingScore: soul.featured ? 100 : 50,
        stats: {
          downloads: Math.floor(Math.random() * 1000) + 100,
          stars: Math.floor(Math.random() * 200) + 10,
          versions: 1,
          comments: 0,
          views: Math.floor(Math.random() * 5000) + 500,
        },
        createdAt: now,
        updatedAt: now,
      })

      // Create initial version
      await ctx.db.insert('soulVersions', {
        soulId,
        version: '1.0.0',
        versionNumber: 1,
        changelog: 'Initial release',
        changelogSource: 'user',
        content: soul.content,
        createdBy: args.adminUserId,
        createdAt: now,
      })
    }

    console.log(`Seeded ${souls.length} souls`)
  },
})

/** Starter pack collections for OpenClaw newcomers. Run after categories and souls exist. */
const STARTER_PACKS = [
  {
    slug: 'developer-companion',
    name: 'Developer Companion',
    description: 'Coding, debugging, and technical souls',
    categorySlug: 'technical',
  },
  {
    slug: 'personal-assistant',
    name: 'Personal Assistant',
    description: 'Organized, proactive, productivity souls',
    categorySlug: 'professional',
  },
  {
    slug: 'creative-partner',
    name: 'Creative Partner',
    description: 'Writing, brainstorming, and storytelling souls',
    categorySlug: 'creative',
  },
  {
    slug: 'ops-devops',
    name: 'Ops & DevOps',
    description: 'Brief, factual, and systems-focused souls',
    categorySlug: 'technical',
  },
]

export const seedStarterPacks = internalMutation({
  args: { ownerUserId: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    const ownerId = args.ownerUserId ?? (await ctx.db.query('users').first())?._id
    if (!ownerId) {
      console.log('No user found; skip seeding starter packs')
      return
    }

    const now = Date.now()
    let created = 0

    for (const pack of STARTER_PACKS) {
      const existing = await ctx.db
        .query('collections')
        .withIndex('by_slug', (q) => q.eq('slug', pack.slug))
        .first()
      if (existing) continue

      const collectionId = await ctx.db.insert('collections', {
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        ownerUserId: ownerId,
        isPublic: true,
        soulCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      created++

      const category = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', pack.categorySlug))
        .first()
      if (!category) continue

      const souls = await ctx.db
        .query('souls')
        .withIndex('by_category', (q) => q.eq('categoryId', category._id))
        .take(5)
      let order = 0
      for (const soul of souls) {
        if (soul.softDeletedAt) continue
        await ctx.db.insert('collectionItems', {
          collectionId,
          soulId: soul._id,
          addedBy: ownerId,
          order: order++,
          createdAt: now,
        })
      }
      await ctx.db.patch(collectionId, { soulCount: order, updatedAt: now })
    }

    console.log(`Starter packs: ${created} new collections created`)
  },
})
