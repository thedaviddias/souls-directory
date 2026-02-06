/**
 * Single collection view - souls in the collection
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SoulCard } from '@/components/souls/soul-card'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'
import { getCollectionBySlug } from '@/lib/convex-server'
import { ROUTES, profilePath } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import type { Soul } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const data = await getCollectionBySlug(slug)
  if (!data) return {}
  return createMetadata({
    title: data.collection.name,
    description: data.collection.description ?? `Collection: ${data.collection.name}`,
    path: `/collections/${slug}`,
  })
}

function collectionSoulToSoul(item: {
  soul: {
    _id: string
    slug: string
    name: string
    tagline: string
    stats: { downloads: number; stars: number; upvotes?: number; versions: number }
  } | null
}): Soul | null {
  if (!item.soul) return null
  const { soul } = item
  return {
    id: soul._id,
    slug: soul.slug,
    ownerHandle: (soul as { ownerHandle?: string | null }).ownerHandle ?? '',
    name: soul.name,
    tagline: soul.tagline,
    description: '',
    content: '',
    category_id: '',
    downloads: soul.stats.downloads,
    stars: soul.stats.stars,
    upvotes: soul.stats.upvotes ?? 0,
    versions: soul.stats.versions,
    featured: false,
    created_at: '',
    updated_at: '',
  }
}

export default async function CollectionSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await getCollectionBySlug(slug)
  if (!data) notFound()

  const { collection, owner, souls: soulItems } = data
  const souls = soulItems.map(collectionSoulToSoul).filter((s): s is Soul => s !== null)

  return (
    <main className="min-h-screen">
      <PageContainer>
        <Breadcrumb
          items={[{ name: 'Collections', href: ROUTES.collections }, { name: collection.name }]}
          className="mb-6"
        />
        <h1 className="text-2xl font-medium text-text mb-2">{collection.name}</h1>
        {collection.description && (
          <p className="text-sm text-text-secondary mb-2">{collection.description}</p>
        )}
        <p className="text-xs text-text-muted font-mono mb-8">
          {collection.soulCount} soul{collection.soulCount !== 1 ? 's' : ''}
          {owner?.displayName ? (
            <>
              {' '}
              · by{' '}
              <Link
                href={owner.handle ? profilePath(owner.handle) : '#'}
                className="text-text-secondary hover:underline"
              >
                {owner.displayName}
              </Link>
            </>
          ) : null}
        </p>

        {souls.length > 0 ? (
          <SoulCardGrid>
            {souls.map((soul) => (
              <SoulCard key={soul.id} soul={soul} />
            ))}
          </SoulCardGrid>
        ) : (
          <p className="text-sm text-text-muted">No souls in this collection yet.</p>
        )}
      </PageContainer>
    </main>
  )
}
