/**
 * RSS Feed alias at /feed.xml
 *
 * Redirects to /feed for canonical URL handling
 */

import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

export function GET() {
  redirect(ROUTES.feed)
}
