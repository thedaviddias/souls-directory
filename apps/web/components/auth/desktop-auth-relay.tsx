'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

const SHOW_FALLBACK_DELAY_MS = 3000

/**
 * Relays OAuth callback codes to the Soul Studio desktop app via deep-link.
 *
 * When the URL contains `?source=desktop&code=...`, this component:
 * 1. Cleans the URL params immediately (so refresh doesn't re-trigger)
 * 2. Attempts to open `soulstudio://auth-callback?code=...`
 * 3. After 3 seconds, shows fallback UI with dismiss + "continue on web" options
 */
export function DesktopAuthRelay() {
  const [relaying, setRelaying] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [signingInWeb, setSigningInWeb] = useState(false)
  const codeRef = useRef<string | null>(null)
  const { signIn } = useAuthActions()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('source')
    const code = params.get('code')

    if (source !== 'desktop' || !code) return

    const session = params.get('session')

    // Store the code before cleaning the URL
    codeRef.current = code
    setRelaying(true)

    // Clean URL params so refresh doesn't re-trigger
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('source')
    cleanUrl.searchParams.delete('code')
    cleanUrl.searchParams.delete('session')
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash)

    // Post code to relay API so the desktop app can poll for it
    if (session) {
      void fetch('/api/auth/desktop-relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, code }),
      })
    }

    // Also attempt deep-link (works in production .app builds)
    window.location.href = `soulstudio://auth-callback?code=${encodeURIComponent(code)}`

    // After a delay, show fallback if we're still on this page
    const timer = setTimeout(() => setShowFallback(true), SHOW_FALLBACK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = useCallback(() => {
    setRelaying(false)
    setShowFallback(false)
  }, [])

  const handleContinueOnWeb = useCallback(async () => {
    const code = codeRef.current
    if (!code) return

    setSigningInWeb(true)
    try {
      // Convex Auth's internal code exchange uses signIn(undefined, { code })
      // but the public type requires a string provider — cast to match runtime behavior
      await (signIn as (...args: unknown[]) => Promise<unknown>)(undefined, { code })
      setRelaying(false)
    } catch {
      // Code may have expired
      setRelaying(false)
    }
  }, [signIn])

  const handleRetryDeepLink = useCallback(() => {
    const code = codeRef.current
    if (code) {
      window.location.href = `soulstudio://auth-callback?code=${encodeURIComponent(code)}`
    }
  }, [])

  if (!relaying) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-sm">
      <div className="text-center space-y-4 max-w-sm px-6">
        <p className="text-lg font-medium text-text">Returning to Soul Studio...</p>

        {!showFallback ? (
          <p className="text-sm text-text-secondary">Opening the desktop app...</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              The desktop app didn&apos;t open. You can try again or continue on the web.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRetryDeepLink}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Try opening Soul Studio again
              </button>
              <button
                type="button"
                onClick={() => void handleContinueOnWeb()}
                disabled={signingInWeb}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:text-text hover:bg-surface transition-colors disabled:opacity-50"
              >
                {signingInWeb ? 'Signing in...' : 'Continue on web instead'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2 text-text-secondary text-sm hover:text-text transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
