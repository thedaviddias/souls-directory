/**
 * Legacy profile URL redirect.
 * Canonical profile URL is /members/[handle].
 */

import { permanentRedirect } from 'next/navigation'
import { profilePath } from '@/lib/routes'

interface PageProps {
  params: Promise<{ handle: string }>
}

export default async function LegacyProfileRedirect({ params }: PageProps) {
  const { handle } = await params
  permanentRedirect(profilePath(handle))
}
