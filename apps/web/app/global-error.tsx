'use client'

/**
 * Global error boundary for Next.js App Router
 *
 * This component catches unhandled errors at the root level and reports them to Sentry.
 * It only handles errors in the root layout - errors in nested layouts/pages
 * are handled by their own error.tsx files.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    // global-error must include html and body tags
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#0a0a0a',
            color: '#fafafa',
          }}
        >
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: '#a1a1a1',
              marginBottom: '2rem',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            An unexpected error occurred. Our team has been notified and is working to fix the
            issue.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fafafa',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onFocus={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onBlur={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && error.message && (
            <pre
              style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#ef4444',
                maxWidth: '100%',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}
        </div>
      </body>
    </html>
  )
}
