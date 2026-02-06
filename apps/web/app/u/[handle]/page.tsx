/**
 * Legacy profile URL redirect.
 * Canonical profile URL is /members/[handle].
 */

import { profilePath } from '@/lib/routes'
import { permanentRedirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ handle: string }>
}

export default async function LegacyProfileRedirect({ params }: PageProps) {
  const { handle } = await params
  permanentRedirect(profilePath(handle))
}
