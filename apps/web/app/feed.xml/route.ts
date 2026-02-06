/**
 * RSS Feed alias at /feed.xml
 *
 * Redirects to /feed for canonical URL handling
 */

import { ROUTES } from '@/lib/routes'
import { redirect } from 'next/navigation'

export function GET() {
  redirect(ROUTES.feed)
}
