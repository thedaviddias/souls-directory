/**
 * Homepage - souls.directory (Server Component)
 *
 * Full SSR - no loading spinners, SEO-friendly, fast FCP.
 * Data is fetched at request time on the server.
 */

import { HomeContent } from '@/components/home/home-content'
import { WebSiteSchema } from '@/components/seo/json-ld'
import { getCategories, getFeaturedSouls, getSoulsList } from '@/lib/convex-server'
import { SITE_CONFIG, createMetadata } from '@/lib/seo'
import type { Category, Soul } from '@/types'

export const metadata = createMetadata({
  title: 'Give Your Agent a Soul | souls.directory',
  description:
    'A curated directory of SOUL.md personality templates for OpenClaw agents. Browse, download, share, or publish your own—free and open source.',
  path: '/',
  noSuffix: true,
  keywords: [
    'SOUL.md',
    'soul openclaw',
    'openclaw soul',
    'personality templates',
    'openclaw templates',
    'agent personality',
  ],
})

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch all data on the server in parallel
  // Each query returns null on failure (logged server-side) so the page
  // still renders with empty sections instead of a 500.
  const [categoriesData, featuredData, allData, recentData] = await Promise.all([
    getCategories(),
    getFeaturedSouls(8),
    getSoulsList({ sort: 'published', limit: 12 }),
    getSoulsList({ sort: 'recent', limit: 8 }),
  ])

  // Transform categories
  // biome-ignore lint/suspicious/noExplicitAny: getCategories returns untyped Convex data
  const categories: Category[] = (categoriesData || []).map((cat: any) => ({
    id: cat._id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description || '',
    icon: cat.icon || '',
    color: cat.color || '#878787',
    soulCount: cat.soulCount ?? 0,
  }))

  // Transform souls helper
  // biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
  const toSoul = (item: any): Soul => ({
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
    versions: item.soul.stats?.versions ?? 1,
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
  })

  const featured: Soul[] = (featuredData || []).map(toSoul)
  const souls: Soul[] = (allData?.items || []).map(toSoul)
  const recentSouls: Soul[] = (recentData?.items || []).map(toSoul)

  const totalSouls = categories.reduce((sum, cat) => sum + (cat.soulCount ?? 0), 0)

  return (
    <>
      <WebSiteSchema />
      <HomeContent
        categories={categories}
        featured={featured}
        souls={souls}
        recentSouls={recentSouls}
        totalSouls={totalSouls}
      />
    </>
  )
}
