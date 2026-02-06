/**
 * Collections list page - public collections and starter packs
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'
import { getPublicCollections } from '@/lib/convex-server'
import { ROUTES, soulsByCategoryPath } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'Collections',
  description:
    'Browse curated soul collections and starter packs for OpenClaw. Find bundles for developers, creatives, and more.',
  path: '/collections',
  keywords: ['collections', 'starter packs', 'SOUL.md bundles', 'OpenClaw'],
})

const STARTER_PACKS = [
  {
    slug: 'developer',
    name: 'Developer Companion',
    description: 'Coding, debugging, and technical souls',
    href: soulsByCategoryPath('technical'),
  },
  {
    slug: 'personal',
    name: 'Personal Assistant',
    description: 'Organized, proactive, productivity souls',
    href: soulsByCategoryPath('professional'),
  },
  {
    slug: 'creative',
    name: 'Creative Partner',
    description: 'Writing, brainstorming, and storytelling souls',
    href: soulsByCategoryPath('creative'),
  },
  {
    slug: 'ops',
    name: 'Ops & DevOps',
    description: 'Brief, factual, and systems-focused souls',
    href: soulsByCategoryPath('technical'),
  },
]

export default async function CollectionsPage() {
  const publicCollections = await getPublicCollections(20)

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Collections', url: '/collections' }]} />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb items={[{ name: 'Collections' }]} className="mb-6" />
          <h1 className="text-2xl font-medium text-text mb-2">Collections</h1>
          <p className="text-sm text-text-secondary mb-10">
            Curated bundles and starter packs for OpenClaw. Pick a theme or browse community
            collections.
          </p>

          {/* Starter Packs - static cards */}
          <section className="mb-12">
            <h2 className="text-lg font-medium text-text mb-4">Starter Packs</h2>
            <p className="text-sm text-text-secondary mb-6">
              Quick-start bundles by use case. Each links to souls in that category.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STARTER_PACKS.map((pack) => (
                <Link
                  key={pack.slug}
                  href={pack.href}
                  className="block p-5 rounded-lg border border-border bg-surface hover:border-text-muted transition-colors"
                >
                  <h3 className="text-sm font-medium text-text mb-1">{pack.name}</h3>
                  <p className="text-xs text-text-secondary">{pack.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Public collections from DB */}
          <section>
            <h2 className="text-lg font-medium text-text mb-4">Community Collections</h2>
            {publicCollections && publicCollections.length > 0 ? (
              <SoulCardGrid>
                {publicCollections.map(({ collection, owner }) => (
                  <Link
                    key={collection._id}
                    href={ROUTES.collectionDetail(collection.slug)}
                    className="block p-5 rounded-lg border border-border bg-surface hover:border-text-muted transition-colors"
                  >
                    <h3 className="text-sm font-medium text-text mb-1">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-text-muted font-mono">
                      {collection.soulCount} soul{collection.soulCount !== 1 ? 's' : ''}
                      {owner?.displayName ? ` · ${owner.displayName}` : ''}
                    </p>
                  </Link>
                ))}
              </SoulCardGrid>
            ) : (
              <p className="text-sm text-text-muted">
                No public collections yet. Create one from your{' '}
                <Link href={ROUTES.dashboard} className="text-text hover:underline">
                  dashboard
                </Link>{' '}
                after signing in.
              </p>
            )}
          </section>
        </PageContainer>
      </main>
    </>
  )
}
