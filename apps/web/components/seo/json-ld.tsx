/**
 * JSON-LD Structured Data Components
 *
 * These components inject Schema.org structured data into pages
 * to improve search engine understanding and rich snippet eligibility.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import { profilePath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'

// =============================================================================
// Types
// =============================================================================

interface BreadcrumbItem {
  name: string
  url: string
}

interface FAQItem {
  question: string
  answer: string
}

interface SoulSchemaProps {
  name: string
  tagline: string
  description?: string
  /** Owner handle for URL (handle-scoped: /souls/{handle}/{slug}) */
  handle?: string
  slug: string
  authorName?: string
  authorHandle?: string
  categoryName?: string
  downloads: number
  stars: number
  createdAt: number
  updatedAt: number
  /** Models this soul was tested with (for agent parseability) */
  testedWithModels?: Array<{ model: string; provider?: string }>
}

interface PersonSchemaProps {
  name: string
  handle: string
  bio?: string
  image?: string
  websiteUrl?: string
  xHandle?: string
  githubHandle?: string
}

// =============================================================================
// Helper: Render JSON-LD script tag
// =============================================================================

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data injection is safe and standard for SEO
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// =============================================================================
// WebSite Schema (Homepage)
// =============================================================================

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    about: {
      '@type': 'SoftwareApplication',
      name: 'OpenClaw',
      url: 'https://openclaw.ai',
      applicationCategory: 'AI Agent Platform',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/souls?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Organization Schema
// =============================================================================

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon-512.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      SITE_CONFIG.socials.github,
      SITE_CONFIG.socials.x,
      SITE_CONFIG.socials.linkedin,
      SITE_CONFIG.socials.youtube,
    ],
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Breadcrumb Schema
// =============================================================================

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_CONFIG.url,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
      })),
    ],
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Soul (SoftwareSourceCode) Schema
// =============================================================================

export function SoulSchema(props: SoulSchemaProps) {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, '')
  const soulPathSegment = props.handle ? `${props.handle}/${props.slug}` : props.slug
  const url = `${baseUrl}/souls/${soulPathSegment}`
  const downloadUrl = `${baseUrl}/api/souls/${soulPathSegment}.md`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: props.name,
    description: props.tagline,
    abstract: props.description || props.tagline,
    url,
    codeRepository: url,
    programmingLanguage: 'Markdown',
    runtimePlatform: 'OpenClaw',
    dateCreated: new Date(props.createdAt).toISOString(),
    dateModified: new Date(props.updatedAt).toISOString(),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'DownloadAction' },
        userInteractionCount: props.downloads,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'LikeAction' },
        userInteractionCount: props.stars,
      },
    ],
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    // Download action for agents and rich results
    potentialAction: {
      '@type': 'DownloadAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: downloadUrl,
      },
    },
    ...(props.testedWithModels?.length
      ? {
          targetProduct: props.testedWithModels.map((t) => ({
            '@type': 'SoftwareApplication',
            name: t.model,
          })),
        }
      : {}),
  }

  // Add author if available
  if (props.authorName) {
    schema.author = {
      '@type': 'Person',
      name: props.authorName,
      url: props.authorHandle ? `${SITE_CONFIG.url}${profilePath(props.authorHandle)}` : undefined,
    }
  }

  // Add category
  if (props.categoryName) {
    schema.genre = props.categoryName
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Creative Work (Alternative Soul Schema for rich snippets)
// =============================================================================

export function CreativeWorkSchema(props: SoulSchemaProps) {
  const soulPathSegment = props.handle ? `${props.handle}/${props.slug}` : props.slug
  const url = `${SITE_CONFIG.url}/souls/${soulPathSegment}`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: props.name,
    description: props.tagline,
    abstract: props.description || props.tagline,
    url,
    dateCreated: new Date(props.createdAt).toISOString(),
    dateModified: new Date(props.updatedAt).toISOString(),
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    keywords: ['SOUL.md', 'OpenClaw', 'personality', 'template', props.categoryName].filter(
      Boolean
    ),
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  }

  if (props.authorName) {
    schema.author = {
      '@type': 'Person',
      name: props.authorName,
      url: props.authorHandle ? `${SITE_CONFIG.url}${profilePath(props.authorHandle)}` : undefined,
    }
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Person Schema (User Profile)
// =============================================================================

export function PersonSchema(props: PersonSchemaProps) {
  const url = `${SITE_CONFIG.url}${profilePath(props.handle)}`

  const sameAs: string[] = []
  if (props.websiteUrl) sameAs.push(props.websiteUrl)
  if (props.xHandle) sameAs.push(`https://x.com/${props.xHandle}`)
  if (props.githubHandle) sameAs.push(`https://github.com/${props.githubHandle}`)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: props.name,
    url,
    description: props.bio,
    image: props.image,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    knowsAbout: ['AI personality templates', 'SOUL.md', 'OpenClaw agents'],
    mainEntityOfPage: {
      '@type': 'ProfilePage',
      '@id': url,
    },
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// FAQ Schema
// =============================================================================

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Collection Page Schema (for browse pages)
// =============================================================================

export function CollectionPageSchema({
  name,
  description,
  url,
  itemCount,
}: {
  name: string
  description: string
  url: string
  itemCount?: number
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url.startsWith('http') ? url : `${SITE_CONFIG.url}${url}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  }

  if (itemCount !== undefined) {
    schema.numberOfItems = itemCount
  }

  return <JsonLd data={schema} />
}

// =============================================================================
// Article Schema (for guide pages)
// =============================================================================

interface ArticleSchemaProps {
  title: string
  description: string
  url: string
  publishedAt: string
  updatedAt?: string
  authorName?: string
  authorUrl?: string
  readingTime?: number
}

export function ArticleSchema({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  authorName,
  authorUrl,
  readingTime,
}: ArticleSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_CONFIG.url}${url}`
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: fullUrl,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  }
  if (authorName) {
    const author: Record<string, unknown> = {
      '@type': 'Person',
      name: authorName,
    }
    if (authorUrl) {
      author.url = authorUrl.startsWith('http') ? authorUrl : `${SITE_CONFIG.url}${authorUrl}`
    }
    schema.author = author
  }
  if (readingTime !== undefined) {
    schema.timeRequired = `PT${readingTime}M`
  }
  return <JsonLd data={schema} />
}
