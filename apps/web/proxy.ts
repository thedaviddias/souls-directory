import { profilePath } from '@/lib/routes'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Proxy for souls.directory
 * - Redirects /souls/[handle] (profile) to /members/[handle]; /souls/[handle]/[slug] is unchanged
 * - Adds security headers (backup to next.config.ts headers)
 * - Basic rate limiting prep (can be extended)
 * - Request logging for debugging
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Match /souls/:handle only (exactly two segments) — not /souls/:handle/:slug
  const match = pathname.match(/^\/souls\/([^/]+)\/?$/)
  if (match) {
    const handle = match[1]
    const url = request.nextUrl.clone()
    url.pathname = profilePath(handle)
    return NextResponse.redirect(url, 308)
  }

  const response = NextResponse.next()

  // Additional security headers (supplement next.config.ts)
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // API-specific handling
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add cache control for public endpoints
    if (
      request.nextUrl.pathname === '/api/categories' ||
      request.nextUrl.pathname === '/api/tags'
    ) {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
