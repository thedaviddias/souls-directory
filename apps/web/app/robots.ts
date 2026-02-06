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
      {
        userAgent: '*',
        allow: '/',
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
      // Allow public soul API (raw SOUL.md fetch) for agents and crawlers
      {
        userAgent: '*',
        allow: ['/api/souls/'],
      },
      // Allow specific API routes for OpenGraph
      {
        userAgent: '*',
        allow: ['/api/og/'],
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
