/**
 * Core domain types for souls.directory
 */

export interface Soul {
  id: string
  slug: string
  /** Owner handle for URL (handle-scoped souls: /souls/{ownerHandle}/{slug}). Always set. */
  ownerHandle: string
  name: string
  tagline: string
  description: string
  content: string
  category_id: string
  author?: string | null
  author_url?: string | null
  downloads: number
  stars?: number
  upvotes?: number
  versions?: number
  featured: boolean
  tested_with?: string[]
  created_at: string
  updated_at: string
  category?: Category
  tags?: Tag[]
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  soulCount?: number
}

export interface Tag {
  id: string
  slug: string
  name: string
}

export interface SoulTag {
  soul_id: string
  tag_id: string
}

/**
 * Type for Supabase join results when fetching souls with tags
 * Represents the structure: soul_tags(tag:tags(*))
 */
export interface SoulTagJoinResult {
  tag: Tag | null
}

/**
 * Raw soul data from Supabase with joined tag results
 */
export interface SoulWithJoinedTags extends Omit<Soul, 'tags'> {
  tags?: SoulTagJoinResult[] | null
}

/**
 * Transform a soul with joined tag data into a Soul with flattened tags array
 */
export function transformSoulFromJoin(soul: SoulWithJoinedTags): Soul {
  return {
    ...soul,
    tags: soul.tags?.map((st) => st.tag).filter((t): t is Tag => t !== null) || [],
  }
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
}

export interface SoulListResponse {
  souls: Soul[]
}

export interface SoulResponse {
  soul: Soul
}

export interface CategoriesResponse {
  categories: Category[]
}

export interface TagsResponse {
  tags: Tag[]
}

/**
 * Query/filter types
 */
export type SortOrder = 'popular' | 'recent' | 'alphabetical'

export interface SoulFilters {
  category?: string
  tag?: string
  q?: string
  sort?: SortOrder
  featured?: boolean
  limit?: number
  offset?: number
}
