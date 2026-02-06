/**
 * Guides index - SEO and how-to content for OpenClaw and SOUL.md
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'Guides',
  description:
    'Guides for OpenClaw and SOUL.md: setup, best souls for developers, and how to write a great personality template.',
  path: '/guides',
  keywords: ['OpenClaw guides', 'SOUL.md guide', 'OpenClaw SOUL.md', 'soul template'],
})

const GUIDES = [
  {
    slug: 'openclaw-soul-md-guide',
    title: 'The Complete Guide to SOUL.md for OpenClaw',
    description: 'What SOUL.md is, how it shapes your agent, and how to install or choose one.',
  },
  {
    slug: 'best-souls-for-developers',
    title: '10 Best SOUL.md Templates for Developers',
    description: 'Curated developer souls: code review, debugging, DevOps, and technical writing.',
  },
  {
    slug: 'openclaw-personality-tips',
    title: 'How to Write a Great SOUL.md',
    description: 'Voice, structure, boundaries, and model compatibility when writing a soul.',
  },
]

export default function GuidesPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Guides', url: '/guides' }]} />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb items={[{ name: 'Guides' }]} className="mb-6" />
          <h1 className="text-2xl font-medium text-text mb-2">Guides</h1>
          <p className="text-sm text-text-secondary mb-10">
            How-to and SEO content for OpenClaw and SOUL.md. Setup, recommendations, and writing
            tips.
          </p>
          <ul className="space-y-4">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={ROUTES.guideDetail(guide.slug)}
                  className="block p-4 rounded-lg border border-border bg-surface hover:border-text-muted transition-colors"
                >
                  <h2 className="text-sm font-medium text-text mb-1">{guide.title}</h2>
                  <p className="text-xs text-text-secondary">{guide.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </PageContainer>
      </main>
    </>
  )
}
