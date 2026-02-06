'use client'

import { VercelToolbar } from '@vercel/toolbar/next'

/**
 * Renders the Vercel Toolbar (dev, preview, and production).
 * Toolbar provides: comments, Flags Explorer (feature flag overrides), and other tools.
 * In production it is only visible to authenticated Vercel team members.
 * @see https://vercel.com/docs/vercel-toolbar
 */
export function VercelToolbarWrapper() {
  return <VercelToolbar />
}
