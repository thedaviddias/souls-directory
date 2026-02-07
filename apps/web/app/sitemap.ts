/**
 * Dynamic sitemap generation
 *
 * Fetches all souls, users, and categories from Convex
 * and generates a comprehensive sitemap for search engines.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { getAllSoulsForSitemap, getAllUsersForSitemap } from '@/lib/convex-server'
import { getAllGuides } from '@/lib/guides'
import { profilePath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import type { MetadataRoute } from 'next'

// Types for sitemap data
type SitemapSoul = NonNullable<Awaited<ReturnType<typeof getAllSoulsForSitemap>>>[number]
type SitemapUser = NonNullable<Awaited<ReturnType<typeof getAllUsersForSitemap>>>[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url

  // Fetch dynamic content in parallel
  const [souls, users] = await Promise.all([
    getAllSoulsForSitemap().catch(() => []),
    getAllUsersForSitemap().catch(() => []),
  ])

  // Static pages with their priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/souls`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/members`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/getting-started`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Guide article pages (from MDX content)
  const guidePages: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.frontmatter.updatedAt ?? guide.frontmatter.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic soul pages - highest priority for content
  const soulPages: MetadataRoute.Sitemap = (souls || []).map((soul: SitemapSoul) => ({
    url: `${baseUrl}/souls/${soul.ownerHandle}/${soul.slug}`,
    lastModified: soul.updatedAt ? new Date(soul.updatedAt) : new Date(soul.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // User profile pages
  const userPages: MetadataRoute.Sitemap = (users || [])
    .filter((user: SitemapUser) => user.handle)
    .map((user: SitemapUser) => ({
      url: `${baseUrl}${profilePath(user.handle)}`,
      lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...staticPages, ...guidePages, ...soulPages, ...userPages]
}
