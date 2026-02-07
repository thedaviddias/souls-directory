/**
 * Guides index - SEO and how-to content for OpenClaw and SOUL.md
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { getAllGuides } from '@/lib/guides'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import { format } from 'date-fns'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'Guides',
  description:
    'Guides for OpenClaw and SOUL.md: setup, best souls for developers, and how to write a great personality template.',
  path: '/guides',
  keywords: ['OpenClaw guides', 'SOUL.md guide', 'OpenClaw SOUL.md', 'soul template'],
})

export default function GuidesPage() {
  const guides = getAllGuides()
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
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={ROUTES.guideDetail(guide.slug)}
                  className="block p-4 rounded-lg border border-border bg-surface hover:border-text-muted transition-colors"
                >
                  <h2 className="text-sm font-medium text-text mb-1">{guide.frontmatter.title}</h2>
                  <p className="text-xs text-text-secondary mb-2">
                    {guide.frontmatter.description}
                  </p>
                  <div className="flex items-center gap-x-3 text-xs text-text-muted">
                    <time dateTime={guide.frontmatter.publishedAt}>
                      {format(new Date(guide.frontmatter.publishedAt), 'PPP')}
                    </time>
                    {guide.readingTime > 0 && <span>{guide.readingTime} min read</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </PageContainer>
      </main>
    </>
  )
}
