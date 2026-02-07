/**
 * Dynamic robots.txt generation
 *
 * Controls how search engines crawl the site.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { SITE_CONFIG } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url

  return {
    rules: [
      // Single User-agent: * block so all crawlers parse allow/disallow correctly (RFC 9309: longest match wins)
      {
        userAgent: '*',
        allow: ['/', '/api/souls/', '/api/og/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/upload/',
          '/login/',
          '/_next/',
          '/private/',
        ],
      },
      // Block AI training crawlers (opt-out of model training)
      // These bots collect data for training AI models
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      // Allow AI search/browsing bots (GEO - helps with citations)
      // ChatGPT-User: ChatGPT's web browsing mode for search queries
      // Claude-Web: Claude's web browsing for citations
      // PerplexityBot: Perplexity AI search engine
      // Allowing these improves visibility in AI-powered search results
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
