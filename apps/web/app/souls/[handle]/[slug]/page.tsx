/**
 * Soul Detail Page - Server Component
 *
 * Full SSR - soul data fetched at request time.
 * URL: /souls/{handle}/{slug}
 */

import { BreadcrumbSchema, SoulSchema } from '@/components/seo/json-ld'
import { SoulDetailContent } from '@/components/souls/soul-detail-content'
import {
  getRelatedSouls,
  getSoulByOwnerAndSlug,
  getSoulContentByOwnerAndSlug,
  getSoulsByOwner,
  getVersionHistory,
} from '@/lib/convex-server'
import { ROUTES, soulPath } from '@/lib/routes'
import { SITE_CONFIG, canonicalUrl, createDynamicMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic'

// Helper type for tag data
interface TagData {
  _id: string
  slug: string
  name: string
}

// Helper type for related soul data
interface RelatedSoulData {
  _id: string
  slug: string
  ownerHandle: string | null
  name: string
  tagline?: string
  description?: string
  stats?: {
    downloads?: number
    stars?: number
    upvotes?: number
  }
  featured?: boolean
  testedWithModels?: Array<{ model: string }>
  createdAt: number
  updatedAt: number
}

interface PageProps {
  params: Promise<{ handle: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle, slug } = await params

  const soulData = await getSoulByOwnerAndSlug(handle, slug)

  const name =
    soulData?.soul?.name ||
    slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const description =
    soulData?.soul?.tagline ||
    `${name} - SOUL.md personality template for OpenClaw. Download and customize your agent.`

  return createDynamicMetadata({
    title: name,
    description,
    path: `/souls/${handle}/${slug}`,
    keywords: [name, 'SOUL.md template', 'soul openclaw', 'openclaw soul', 'personality template'],
    ogImage: '/og-default.png',
    ogImageAlt: `${name} - SOUL.md template on ${SITE_CONFIG.name}`,
    ogType: 'article',
  })
}

export default async function SoulPage({ params }: PageProps) {
  const { handle, slug } = await params

  const [soulData, content] = await Promise.all([
    getSoulByOwnerAndSlug(handle, slug),
    getSoulContentByOwnerAndSlug(handle, slug),
  ])

  if (!soulData || !soulData.soul) {
    notFound()
  }

  const [relatedSoulsFromApi, authorSoulsFromApi, versionHistoryRaw] = await Promise.all([
    getRelatedSouls(soulData.soul._id, 6),
    soulData.owner
      ? getSoulsByOwner(soulData.owner._id, soulData.soul._id, 3)
      : Promise.resolve(null),
    getVersionHistory(soulData.soul._id, 5),
  ])

  const relatedSouls = (relatedSoulsFromApi ?? []) as RelatedSoulData[]
  const authorSouls = (authorSoulsFromApi ?? []) as RelatedSoulData[]
  const versionHistory = (versionHistoryRaw ?? []) as Array<{
    _id: string
    version: string
    versionNumber: number
    changelog: string
    createdAt: number
  }>

  const { soul, owner, category, tags, forkedFrom } = soulData
  const ownerHandle = soul.ownerHandle ?? owner?.handle ?? handle

  const transformedData = {
    forkedFrom: forkedFrom ?? null,
    soul: {
      id: soul._id,
      slug: soul.slug,
      ownerHandle,
      name: soul.name,
      tagline: soul.tagline || '',
      description: soul.description || '',
      stats: {
        downloads: soul.stats?.downloads || 0,
        stars: soul.stats?.stars || 0,
        upvotes: soul.stats?.upvotes || 0,
        versions: soul.stats?.versions || 1,
        comments: soul.stats?.comments || 0,
        views: soul.stats?.views || 0,
      },
      testedWithModels: (soul.testedWithModels || []).map((t: { model: string }) => t.model),
      featured: soul.featured || false,
      createdAt: soul.createdAt,
      updatedAt: soul.updatedAt,
    },
    owner: owner
      ? {
          id: owner._id,
          handle: owner.handle ?? null,
          displayName: owner.displayName ?? undefined,
          deletedAt: owner.deletedAt,
        }
      : null,
    category: category
      ? {
          id: category._id,
          slug: category.slug,
          name: category.name,
          description: category.description || '',
          icon: category.icon || '',
          color: category.color || '#878787',
        }
      : null,
    tags: ((tags || []) as Array<TagData | null>)
      .filter((t): t is TagData => t !== null)
      .map((t) => ({
        id: t._id,
        slug: t.slug,
        name: t.name,
      })),
    relatedSouls: relatedSouls
      .filter((s): s is RelatedSoulData => s !== null)
      .map((s) => ({
        id: s._id,
        slug: s.slug,
        ownerHandle: s.ownerHandle ?? '',
        name: s.name,
        tagline: s.tagline || '',
        description: s.description || '',
        content: '',
        downloads: s.stats?.downloads || 0,
        stars: s.stats?.stars || 0,
        upvotes: s.stats?.upvotes || 0,
        featured: s.featured || false,
        tested_with: (s.testedWithModels || []).map((t) => t.model),
        category_id: category?._id || '',
        category: category
          ? {
              id: category._id,
              slug: category.slug,
              name: category.name,
              description: category.description || '',
              icon: category.icon || '',
              color: category.color || '#878787',
            }
          : undefined,
        tags: [],
        created_at: new Date(s.createdAt).toISOString(),
        updated_at: new Date(s.updatedAt).toISOString(),
      })),
    authorSouls: authorSouls.map((s) => ({
      id: s._id,
      slug: s.slug,
      ownerHandle: s.ownerHandle ?? '',
      name: s.name,
      tagline: s.tagline || '',
      description: s.description || '',
      content: '',
      downloads: s.stats?.downloads || 0,
      stars: s.stats?.stars || 0,
      upvotes: s.stats?.upvotes || 0,
      featured: s.featured || false,
      tested_with: [],
      category_id: category?._id || '',
      category: category
        ? {
            id: category._id,
            slug: category.slug,
            name: category.name,
            description: category.description || '',
            icon: category.icon || '',
            color: category.color || '#878787',
          }
        : undefined,
      tags: [],
      created_at: new Date(s.createdAt).toISOString(),
      updated_at: new Date(s.updatedAt).toISOString(),
    })),
    versionHistory,
    shareUrl: canonicalUrl(`/souls/${ownerHandle}/${soul.slug}`),
    content: content || '',
  }

  return (
    <>
      <SoulSchema
        name={soul.name}
        tagline={soul.tagline}
        description={soul.description}
        handle={ownerHandle}
        slug={soul.slug}
        authorName={owner?.displayName || owner?.name || undefined}
        authorHandle={owner?.handle || undefined}
        categoryName={category?.name}
        downloads={transformedData.soul.stats.downloads}
        stars={transformedData.soul.stats.stars}
        createdAt={soul.createdAt}
        updatedAt={soul.updatedAt}
        testedWithModels={soul.testedWithModels}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Souls', url: ROUTES.souls },
          { name: soul.name, url: soulPath(ownerHandle, soul.slug) },
        ]}
      />
      <SoulDetailContent data={transformedData} />
    </>
  )
}
