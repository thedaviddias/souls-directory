import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Embedding dimensions for vector search
export const EMBEDDING_DIMENSIONS = 1536

// Auth tables from @convex-dev/auth
const authSchema = authTables as unknown as Record<string, ReturnType<typeof defineTable>>

// Users - enhanced profile with GitHub integration
const users = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  // Profile
  handle: v.optional(v.string()),
  displayName: v.optional(v.string()),
  bio: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  xHandle: v.optional(v.string()),
  twitterHandle: v.optional(v.string()), // deprecated: use xHandle; will be removed after migration
  mastodonHandle: v.optional(v.string()), // e.g. user@mastodon.social
  blueskyHandle: v.optional(v.string()), // e.g. user.bsky.social
  githubHandle: v.optional(v.string()),
  // Role & Status
  role: v.optional(v.union(v.literal('admin'), v.literal('moderator'), v.literal('user'))),
  commentsBannedAt: v.optional(v.number()),
  // GitHub metadata
  githubId: v.optional(v.string()),
  githubCreatedAt: v.optional(v.number()),
  githubFetchedAt: v.optional(v.number()),
  // Timestamps
  deletedAt: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index('email', ['email'])
  .index('handle', ['handle'])
  .index('githubId', ['githubId'])

// Categories for organizing souls
const categories = defineTable({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.string(),
  color: v.string(),
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_order', ['order'])

// Tags for filtering souls
const tags = defineTable({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  createdAt: v.number(),
}).index('by_slug', ['slug'])

// Souls - the main content
const souls = defineTable({
  slug: v.string(),
  name: v.string(),
  tagline: v.string(),
  description: v.optional(v.string()),
  // Owner
  ownerUserId: v.id('users'),
  ownerHandle: v.optional(v.string()), // Denormalized for URL construction (handle-scoped slugs)
  // Category & Tags
  categoryId: v.optional(v.id('categories')),
  tagIds: v.optional(v.array(v.id('tags'))),
  // Versioning
  latestVersionId: v.optional(v.id('soulVersions')),
  // "Tested with" model badges
  testedWithModels: v.optional(
    v.array(
      v.object({
        model: v.string(), // e.g., "claude-sonnet-4.5", "gpt-4o"
        provider: v.string(), // e.g., "anthropic", "openai"
        testedAt: v.number(),
        testedByUserId: v.optional(v.id('users')),
      })
    )
  ),
  // Related souls (curated)
  relatedSoulIds: v.optional(v.array(v.id('souls'))),
  // Fork lineage (when this soul was remixed from another)
  forkedFromId: v.optional(v.id('souls')),
  // Stats
  stats: v.object({
    downloads: v.number(),
    stars: v.number(),
    upvotes: v.optional(v.number()),
    versions: v.number(),
    comments: v.number(),
    views: v.number(),
  }),
  // Featured/Trending
  featured: v.optional(v.boolean()),
  trendingScore: v.optional(v.number()),
  // Moderation
  moderationStatus: v.optional(
    v.union(v.literal('active'), v.literal('hidden'), v.literal('removed'))
  ),
  softDeletedAt: v.optional(v.number()),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_owner_slug', ['ownerHandle', 'slug'])
  .index('by_owner', ['ownerUserId'])
  .index('by_category', ['categoryId'])
  .index('by_updated', ['updatedAt'])
  .index('by_created', ['createdAt'])
  .index('by_downloads', ['stats.downloads'])
  .index('by_stars', ['stats.stars'])
  .index('by_trending', ['trendingScore', 'updatedAt'])
  .index('by_featured', ['featured', 'updatedAt'])
  // Full-text search indexes
  .searchIndex('search_name', {
    searchField: 'name',
    filterFields: ['categoryId', 'moderationStatus'],
  })
  .searchIndex('search_tagline', {
    searchField: 'tagline',
    filterFields: ['categoryId', 'moderationStatus'],
  })

// Soul Versions - content history
const soulVersions = defineTable({
  soulId: v.id('souls'),
  version: v.string(), // Semver string (e.g., "1.0.0")
  versionNumber: v.number(), // Auto-incremented integer for ordering
  fingerprint: v.optional(v.string()),
  changelog: v.string(),
  changelogSource: v.optional(v.union(v.literal('auto'), v.literal('user'))),
  // Content
  content: v.string(), // The actual SOUL.md markdown
  // Files (for multi-file souls in future)
  files: v.optional(
    v.array(
      v.object({
        path: v.string(),
        size: v.number(),
        storageId: v.id('_storage'),
        sha256: v.string(),
        contentType: v.optional(v.string()),
      })
    )
  ),
  // Parsed frontmatter
  parsed: v.optional(
    v.object({
      frontmatter: v.record(v.string(), v.any()),
      metadata: v.optional(v.any()),
    })
  ),
  // Source - for tracking where the content came from (upload vs GitHub import)
  source: v.optional(
    v.object({
      kind: v.union(v.literal('upload'), v.literal('github')),
      // GitHub-specific fields
      url: v.optional(v.string()),
      repo: v.optional(v.string()),
      ref: v.optional(v.string()),
      commit: v.optional(v.string()),
      path: v.optional(v.string()),
      importedAt: v.optional(v.number()),
    })
  ),
  // Creator
  createdBy: v.id('users'),
  createdAt: v.number(),
  softDeletedAt: v.optional(v.number()),
})
  .index('by_soul', ['soulId'])
  .index('by_soul_version', ['soulId', 'version'])
  .index('by_soul_number', ['soulId', 'versionNumber'])

// Soul embeddings for vector search
const soulEmbeddings = defineTable({
  soulId: v.id('souls'),
  versionId: v.id('soulVersions'),
  ownerId: v.id('users'),
  embedding: v.array(v.number()),
  isLatest: v.boolean(),
  visibility: v.string(),
  updatedAt: v.number(),
})
  .index('by_soul', ['soulId'])
  .index('by_version', ['versionId'])
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: EMBEDDING_DIMENSIONS,
    filterFields: ['visibility'],
  })

// Stars (likes)
const stars = defineTable({
  soulId: v.id('souls'),
  userId: v.id('users'),
  createdAt: v.number(),
})
  .index('by_soul', ['soulId'])
  .index('by_user', ['userId'])
  .index('by_soul_user', ['soulId', 'userId'])

// Upvotes (quality signal)
const upvotes = defineTable({
  soulId: v.id('souls'),
  userId: v.id('users'),
  createdAt: v.number(),
})
  .index('by_soul', ['soulId'])
  .index('by_user', ['userId'])
  .index('by_soul_user', ['soulId', 'userId'])

// Comments
const comments = defineTable({
  soulId: v.id('souls'),
  userId: v.id('users'),
  body: v.string(),
  // Reply threading
  parentCommentId: v.optional(v.id('comments')),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  softDeletedAt: v.optional(v.number()),
  deletedBy: v.optional(v.id('users')),
})
  .index('by_soul', ['soulId'])
  .index('by_soul_created', ['soulId', 'createdAt'])
  .index('by_user', ['userId'])
  .index('by_parent', ['parentCommentId'])

// Collections (folders) - NEW feature
const collections = defineTable({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  ownerUserId: v.id('users'),
  // Privacy
  isPublic: v.boolean(),
  // Cover image
  coverImageUrl: v.optional(v.string()),
  // Stats
  soulCount: v.number(),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_slug', ['slug'])
  .index('by_owner', ['ownerUserId'])
  .index('by_public', ['isPublic', 'updatedAt'])

// Collection items (souls in collections)
const collectionItems = defineTable({
  collectionId: v.id('collections'),
  soulId: v.id('souls'),
  addedBy: v.id('users'),
  order: v.number(),
  note: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_collection', ['collectionId', 'order'])
  .index('by_soul', ['soulId'])
  .index('by_collection_soul', ['collectionId', 'soulId'])

// Downloads tracking
const downloads = defineTable({
  soulId: v.id('souls'),
  versionId: v.optional(v.id('soulVersions')),
  userId: v.optional(v.id('users')),
  // Analytics
  userAgent: v.optional(v.string()),
  referer: v.optional(v.string()),
  country: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_soul', ['soulId'])
  .index('by_date', ['createdAt'])

// Daily stats for trending calculation
const dailyStats = defineTable({
  soulId: v.id('souls'),
  day: v.number(), // Unix day (Date.now() / 86400000)
  downloads: v.number(),
  views: v.number(),
  stars: v.number(),
  updatedAt: v.number(),
})
  .index('by_soul_day', ['soulId', 'day'])
  .index('by_day', ['day'])

// Audit logs for moderation
const auditLogs = defineTable({
  actorUserId: v.id('users'),
  action: v.string(),
  targetType: v.string(),
  targetId: v.string(),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
  .index('by_actor', ['actorUserId'])
  .index('by_target', ['targetType', 'targetId'])

// Reports for moderation (target is either a soul or a comment)
const reports = defineTable({
  soulId: v.optional(v.id('souls')),
  commentId: v.optional(v.id('comments')),
  userId: v.id('users'),
  reason: v.string(),
  details: v.optional(v.string()),
  status: v.union(v.literal('pending'), v.literal('reviewed'), v.literal('dismissed')),
  reviewedBy: v.optional(v.id('users')),
  reviewedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index('by_soul', ['soulId'])
  .index('by_comment', ['commentId'])
  .index('by_user', ['userId'])
  .index('by_status', ['status', 'createdAt'])
  .index('by_user_comment', ['userId', 'commentId'])

export default defineSchema({
  ...authSchema,
  users,
  categories,
  tags,
  souls,
  soulVersions,
  soulEmbeddings,
  stars,
  upvotes,
  comments,
  collections,
  collectionItems,
  downloads,
  dailyStats,
  auditLogs,
  reports,
})
