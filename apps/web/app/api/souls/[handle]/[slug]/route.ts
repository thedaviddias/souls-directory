/**
 * Soul content API endpoint.
 *
 * GET /api/souls/{handle}/{slug}.md - Returns raw markdown content
 *
 * Features:
 * - Rate limiting: 10 requests/minute per IP
 * - Caching: 5 min CDN cache, 10 min stale-while-revalidate
 * - Returns 429 when rate limit exceeded
 * - Returns 404 for unknown souls
 */

import { api } from '@/lib/convex-api'
import { checkRateLimit } from '@/lib/rate-limit'
import { fetchQuery } from 'convex/nextjs'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string; slug: string }> }
) {
  const { handle: rawHandle, slug: rawSlug } = await params

  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  const { allowed, remaining, resetAt } = await checkRateLimit(ip)
  if (!allowed) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
        'X-Souls-Directory': 'true',
      },
    })
  }

  const handle = rawHandle
  const slug = rawSlug.replace(/\.md$/, '')

  const content = await fetchQuery(api.souls.getContent, { handle, slug })

  if (!content) {
    return new NextResponse('Soul not found', {
      status: 404,
      headers: { 'X-Souls-Directory': 'true' },
    })
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `inline; filename="${slug}.md"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
      'X-Souls-Directory': 'true',
    },
  })
}
