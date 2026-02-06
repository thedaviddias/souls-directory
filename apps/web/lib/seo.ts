/**
 * Centralized SEO configuration for souls.directory
 *
 * All metadata generation should use these constants and helpers
 * to ensure consistency across pages.
 */

import type { Metadata } from 'next'

// =============================================================================
// Site Configuration
// =============================================================================

export const SITE_CONFIG = {
  name: 'souls.directory',
  url: 'https://souls.directory',
  description: 'A curated directory of SOUL.md personality templates for OpenClaw agents.',
  tagline: 'Give your agent a soul.',
  defaultOGImage: '/og-default.png',
  handle: 'thedaviddias',
  x: '@thedaviddias',
  locale: 'en_US',
  socials: {
    github: 'https://github.com/thedaviddias/souls-directory',
    x: 'https://x.com/thedaviddias',
    linkedin: 'https://www.linkedin.com/in/thedaviddias',
    youtube: 'https://www.youtube.com/@thedaviddias',
    openclaw: 'https://openclaw.ai',
  },
} as const

// =============================================================================
// Default Keywords
// =============================================================================

export const DEFAULT_KEYWORDS: string[] = [
  'SOUL.md',
  'soul openclaw',
  'openclaw soul',
  'OpenClaw',
  'openclaw.ai',
  'personality templates',
  'agent personality',
  'openclaw templates',
  'soul.md files',
]

// =============================================================================
// Metadata Configuration Type
// =============================================================================

interface MetadataConfig {
  /** Page title (will be appended with site name unless noSuffix is true) */
  title: string
  /** Page description */
  description: string
  /**
   * Page path (e.g., '/about') - used for canonical URL.
   * Must be path-only with no query string for listing/filter pages
   * so that alternates.canonical stays query-free and avoids duplicate-content issues.
   */
  path?: string
  /** Additional keywords to merge with defaults */
  keywords?: string[]
  /** OpenGraph image URL (defaults to SITE_CONFIG.defaultOGImage) */
  ogImage?: string
  /** OpenGraph image alt text */
  ogImageAlt?: string
  /** OpenGraph type (defaults to 'website') */
  ogType?: 'website' | 'article' | 'profile'
  /** Don't append site name to title */
  noSuffix?: boolean
  /** Prevent search engines from indexing this page */
  noIndex?: boolean
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a page title with the site name suffix
 */
export function formatTitle(title: string, noSuffix = false): string {
  if (noSuffix || title === SITE_CONFIG.name) {
    return title
  }
  return `${title} | ${SITE_CONFIG.name}`
}

/**
 * Generate a canonical URL for a given path
 */
export function canonicalUrl(path = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_CONFIG.url}${cleanPath}`
}

/**
 * Generate full metadata object for a page
 *
 * NOTE: The root layout has a title template `%s | souls.directory`,
 * so the `title` field should be just the page name (e.g., "About").
 * OpenGraph/Twitter get the full formatted title since they don't use the template.
 *
 * For pages that need no suffix (like homepage), use `noSuffix: true` -
 * this sets an absolute title to bypass the layout template.
 *
 * @example
 * ```ts
 * export const metadata = createMetadata({
 *   title: 'About',
 *   description: 'Learn about souls.directory',
 *   path: '/about',
 * })
 * ```
 */
export function createMetadata(config: MetadataConfig): Metadata {
  const {
    title,
    description,
    path = '/',
    keywords = [],
    ogImage = SITE_CONFIG.defaultOGImage,
    ogImageAlt = `${title} - ${SITE_CONFIG.name}`,
    ogType = 'website',
    noSuffix = false,
    noIndex = false,
  } = config

  // Social title always gets full format (OG/Twitter don't use template)
  const socialTitle = formatTitle(title, noSuffix)
  const url = canonicalUrl(path)

  // Merge custom keywords with defaults, removing duplicates
  const allKeywords = [...new Set([...DEFAULT_KEYWORDS, ...keywords])]

  const metadata: Metadata = {
    // Page title:
    // - Normal pages: just the title (layout template adds "| souls.directory")
    // - noSuffix pages: absolute title to bypass the template
    title: noSuffix ? { absolute: title } : title,
    description,
    keywords: allKeywords,
    openGraph: {
      // Social title needs full format since OG doesn't use template
      title: socialTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: ogType,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${SITE_CONFIG.url}${ogImage}`,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      // Social title needs full format since Twitter doesn't use template
      title: socialTitle,
      description,
      creator: SITE_CONFIG.x,
      images: [ogImage.startsWith('http') ? ogImage : `${SITE_CONFIG.url}${ogImage}`],
    },
    alternates: {
      canonical: url,
    },
  }

  // Add robots directives for noindex pages
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    }
  }

  return metadata
}

/**
 * Generate metadata for auth-required pages (noindex by default)
 */
export function createAuthPageMetadata(
  title: string,
  description = `${title} on ${SITE_CONFIG.name}`
): Metadata {
  return createMetadata({
    title,
    description,
    noIndex: true,
  })
}

/**
 * Generate metadata for dynamic pages with user-provided data
 *
 * @example
 * ```ts
 * export async function generateMetadata({ params }) {
 *   const soul = await getSoul(params.slug)
 *   return createDynamicMetadata({
 *     title: soul.name,
 *     description: soul.tagline,
 *     path: `/souls/${soul.slug}`,
 *   })
 * }
 * ```
 */
export function createDynamicMetadata(config: MetadataConfig): Metadata {
  return createMetadata(config)
}

// =============================================================================
// Root Layout Metadata (used in layout.tsx)
// =============================================================================

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: 'David Dias', url: 'https://thedaviddias.com' }],
  creator: 'David Dias',
  publisher: SITE_CONFIG.name,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
    locale: SITE_CONFIG.locale,
    images: [
      {
        url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    creator: SITE_CONFIG.x,
    images: [`${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    types: {
      'application/rss+xml': `${SITE_CONFIG.url}/feed`,
      'application/atom+xml': `${SITE_CONFIG.url}/feed?format=atom`,
    },
  },
}
