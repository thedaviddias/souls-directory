'use client'

/**
 * Route error boundary for settings page.
 * Reports to Sentry with route tag and offers try again / back to dashboard.
 */

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'route', route: 'settings' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h2 className="text-lg font-medium text-text mb-2">Something went wrong</h2>
      <p className="text-sm text-text-muted max-w-md mb-6">
        We couldn’t load settings. Our team has been notified. You can try again or go to your
        dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href={ROUTES.dashboard}>Go to dashboard</Link>
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && error.message && (
        <pre className="mt-8 p-4 bg-surface border border-border rounded-md text-xs text-error text-left max-w-full overflow-auto">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}
    </div>
  )
}
