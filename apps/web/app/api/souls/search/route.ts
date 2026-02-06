/**
 * Agent search API — JSON endpoint for programmatic soul discovery.
 *
 * GET /api/souls/search?q=developer&category=technical&limit=10
 * Returns: { souls: [{ slug, name, tagline, installCommand }] }
 *
 * Rate limited to 5 req/min per IP (stricter than soul fetch).
 */

import { api } from '@/lib/convex-api'
import { checkRateLimitSearch } from '@/lib/rate-limit'
import { SITE_CONFIG } from '@/lib/seo'
import { fetchQuery } from 'convex/nextjs'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_LIMIT = 25

type SoulWithSlug = {
  soul: { slug: string; ownerHandle?: string | null; name: string; tagline: string | null }
}

export async function GET(request: Request) {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const { allowed, remaining, resetAt } = await checkRateLimitSearch(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
          'X-Souls-Directory': 'true',
        },
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category')?.trim() ?? undefined
  const limit = Math.min(Number.parseInt(searchParams.get('limit') ?? '10', 10) || 10, MAX_LIMIT)

  const baseUrl = SITE_CONFIG.url.replace(/\/$/, '')

  try {
    if (q.length >= 2) {
      const matches = await fetchQuery(api.search.searchSouls, {
        query: q,
        categorySlug: category,
        limit,
      })
      const souls = matches.map(({ soul }: SoulWithSlug) => {
        const pathSegment = soul.ownerHandle ? `${soul.ownerHandle}/${soul.slug}` : soul.slug
        return {
          slug: soul.slug,
          name: soul.name,
          tagline: soul.tagline ?? '',
          installCommand: `curl ${baseUrl}/api/souls/${pathSegment}.md > ~/.openclaw/workspace/SOUL.md`,
        }
      })
      return NextResponse.json(
        { souls },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
            'X-Souls-Directory': 'true',
          },
        }
      )
    }

    const result = await fetchQuery(api.souls.list, {
      categorySlug: category,
      sort: 'recent',
      limit,
    })
    const souls = result.items.map(({ soul }: SoulWithSlug) => {
      const pathSegment = soul.ownerHandle ? `${soul.ownerHandle}/${soul.slug}` : soul.slug
      return {
        slug: soul.slug,
        name: soul.name,
        tagline: soul.tagline ?? '',
        installCommand: `curl ${baseUrl}/api/souls/${pathSegment}.md > ~/.openclaw/workspace/SOUL.md`,
      }
    })
    return NextResponse.json(
      { souls },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
          'X-Souls-Directory': 'true',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed.' },
      {
        status: 500,
        headers: { 'X-Souls-Directory': 'true' },
      }
    )
  }
}
