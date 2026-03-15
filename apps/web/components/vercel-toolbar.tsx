'use client'

import { VercelToolbar } from '@vercel/toolbar/next'

/**
 * Renders the Vercel Toolbar only in local development and Vercel preview deployments.
 * Production always returns null to avoid exposing the toolbar on the live site.
 * @see https://vercel.com/docs/vercel-toolbar
 */
export function VercelToolbarWrapper({ environment }: { environment?: string }) {
  if (environment === 'production') {
    return null
  }

  return <VercelToolbar />
}
