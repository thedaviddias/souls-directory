/**
 * Guide article page - MDX content with sidebar TOC and Article SEO.
 */

import { GuideLayout } from '@/components/guides/guide-layout'
import { mdxGuideComponents } from '@/components/guides/mdx-components'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/json-ld'
import { getGuide, getGuidesSlugs } from '@/lib/guides'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import { format } from 'date-fns'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getGuidesSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return { title: 'Not found' }
  const path = `/guides/${slug}`
  return createMetadata({
    title: guide.frontmatter.title,
    description: guide.frontmatter.description,
    path,
    keywords: guide.frontmatter.keywords,
    ogType: 'article',
  })
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const path = `/guides/${slug}`
  const publishedAt = guide.frontmatter.publishedAt
  const updatedAt = guide.frontmatter.updatedAt ?? publishedAt

  const mdxContent = await MDXRemote({
    source: guide.content,
    components: mdxGuideComponents,
  })

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Guides', url: '/guides' },
          { name: guide.frontmatter.title, url: path },
        ]}
      />
      <ArticleSchema
        title={guide.frontmatter.title}
        description={guide.frontmatter.description}
        url={path}
        publishedAt={publishedAt}
        updatedAt={updatedAt}
        authorName={guide.frontmatter.author}
        readingTime={guide.readingTime}
      />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb
            items={[{ name: 'Guides', href: ROUTES.guides }, { name: guide.frontmatter.title }]}
            className="mb-6"
          />
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-text mb-2">{guide.frontmatter.title}</h1>
            <p className="text-sm text-text-secondary mb-4">{guide.frontmatter.description}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
              <time dateTime={publishedAt}>{format(new Date(publishedAt), 'PPP')}</time>
              {guide.readingTime > 0 && <span>{guide.readingTime} min read</span>}
            </div>
          </div>
          <GuideLayout headings={guide.headings}>{mdxContent}</GuideLayout>
        </PageContainer>
      </main>
    </>
  )
}
