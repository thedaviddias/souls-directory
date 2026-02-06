/**
 * Souls Browse Page - Server Component
 *
 * Full SSR - data fetched at request time on the server.
 * Client components handle filtering/sorting interactivity.
 */

import { BrowseContent } from '@/components/browse/browse-content'
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo/json-ld'
import { getCategoriesList, getSoulsList } from '@/lib/convex-server'
import { SITE_CONFIG, createMetadata } from '@/lib/seo'
import type { Category, Soul } from '@/types'

// Helper types for Convex data transformation
// biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
type CategoryData = any
// biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
type SoulListItem = any

export const metadata = createMetadata({
  title: 'Souls',
  description:
    'Browse SOUL.md personality templates for OpenClaw. Discover and download souls by category, search by name, or filter by popularity.',
  path: '/souls',
  keywords: [
    'SOUL.md browse',
    'soul openclaw',
    'openclaw soul',
    'personality templates',
    'openclaw templates',
  ],
  ogImage: '/og-browse.png',
  ogImageAlt: 'Browse SOUL.md templates on souls.directory',
})

// Force dynamic rendering for fresh data on each request
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    model?: string
    sort?: 'recent' | 'published' | 'popular' | 'trending' | 'hot'
    featured?: string
  }>
}

export default async function SoulsPage({ searchParams }: PageProps) {
  // Await searchParams (Next.js 15+ async searchParams)
  const params = await searchParams

  const categorySlug = params.category
  const model = params.model
  const sort = params.sort ?? 'recent'
  const featured = params.featured === 'true'

  // Fetch data on the server in parallel
  const [categoriesData, soulsData] = await Promise.all([
    getCategoriesList(),
    getSoulsList({
      categorySlug,
      model,
      sort,
      featured: featured || undefined,
      limit: 50,
    }),
  ])

  // Transform categories
  const categories: Category[] = (categoriesData || []).map((cat: CategoryData) => ({
    id: cat._id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description || '',
    icon: cat.icon || '',
    color: cat.color || '#878787',
  }))

  // Transform souls
  const souls: Soul[] = (soulsData?.items || []).map((item: SoulListItem) => ({
    id: item.soul._id,
    slug: item.soul.slug,
    ownerHandle: item.soul.ownerHandle ?? '',
    name: item.soul.name,
    tagline: item.soul.tagline || '',
    description: item.soul.description || '',
    content: '',
    downloads: item.soul.stats?.downloads || 0,
    stars: item.soul.stats?.stars || 0,
    upvotes: item.soul.stats?.upvotes || 0,
    featured: item.soul.featured || false,
    tested_with: (item.soul.testedWithModels || []).map((t: { model: string }) => t.model),
    category_id: item.category?._id || '',
    category: item.category
      ? {
          id: item.category._id,
          slug: item.category.slug,
          name: item.category.name,
          description: item.category.description || '',
          icon: item.category.icon || '',
          color: item.category.color || '#878787',
        }
      : undefined,
    tags: [],
    created_at: new Date(item.soul.createdAt).toISOString(),
    updated_at: new Date(item.soul.updatedAt).toISOString(),
  }))

  return (
    <>
      <CollectionPageSchema
        name="Browse SOUL.md Templates"
        description="Discover and download SOUL.md personality templates for OpenClaw."
        url="/souls"
        itemCount={souls.length}
      />
      <BreadcrumbSchema items={[{ name: 'Souls', url: '/souls' }]} />
      <BrowseContent initialCategories={categories} initialSouls={souls} />
    </>
  )
}
