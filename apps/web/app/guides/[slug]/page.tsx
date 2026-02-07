/**
 * Guide article page - MDX content with sidebar TOC and Article SEO.
 */

import { GuideLayout } from '@/components/guides/guide-layout'
import { GuideShareButton } from '@/components/guides/guide-share-button'
import { mdxGuideComponents } from '@/components/guides/mdx-components'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/json-ld'
import { getUserByHandle } from '@/lib/convex-server'
import { getGuide, getGuidesSlugs } from '@/lib/guides'
import { ROUTES, profilePath } from '@/lib/routes'
import { SITE_CONFIG, createMetadata } from '@/lib/seo'
import { getUserDisplayName, getUserHandle, getUserImage } from '@/lib/user-display'
import { format, isToday, isYesterday } from 'date-fns'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const DEFAULT_AUTHOR_NAME = 'David Dias'

function formatGuideDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'PPP')
}

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

  // Resolve author: frontmatter → Convex (site author) → fallback
  let authorName = guide.frontmatter.author
  let authorHandle: string | null = null
  let authorImage: string | null = null
  if (authorName) {
    // When frontmatter author is set, we don't have a handle unless it matches site author
    if (authorName === DEFAULT_AUTHOR_NAME) {
      const siteUser = await getUserByHandle(SITE_CONFIG.handle)
      if (siteUser) {
        authorHandle = getUserHandle(siteUser)
        authorImage = getUserImage(siteUser)
      }
    }
  } else {
    const siteUser = await getUserByHandle(SITE_CONFIG.handle)
    authorName = siteUser ? getUserDisplayName(siteUser) : DEFAULT_AUTHOR_NAME
    if (siteUser) {
      authorHandle = getUserHandle(siteUser)
      authorImage = getUserImage(siteUser)
    }
  }
  const authorUrl = authorHandle ? profilePath(authorHandle) : undefined
  const shareUrl = `${SITE_CONFIG.url.replace(/\/$/, '')}${path}`

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
        authorName={authorName}
        authorUrl={authorUrl}
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
              {authorName &&
                (authorHandle ? (
                  <Link
                    href={profilePath(authorHandle)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
                  >
                    {authorImage && (
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src={authorImage}
                          alt={`${authorName}'s profile photo`}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      </span>
                    )}
                    By {authorName}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    {authorImage && (
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src={authorImage}
                          alt={`${authorName}'s profile photo`}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      </span>
                    )}
                    By {authorName}
                  </span>
                ))}
              <time dateTime={publishedAt}>{formatGuideDate(publishedAt)}</time>
              {guide.readingTime > 0 && <span>{guide.readingTime} min read</span>}
              <GuideShareButton
                title={guide.frontmatter.title}
                description={guide.frontmatter.description}
                shareUrl={shareUrl}
              />
            </div>
          </div>
          <GuideLayout headings={guide.headings}>{mdxContent}</GuideLayout>
        </PageContainer>
      </main>
    </>
  )
}
