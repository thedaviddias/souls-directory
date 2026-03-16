'use client'

import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { type ReactNode, useCallback } from 'react'
import { Toaster } from 'sonner'
import { DesktopAuthRelay } from '@/components/auth/desktop-auth-relay'
import { KeyboardShortcutsProvider } from '@/components/shortcuts/keyboard-shortcuts-provider'
import { OpenPanelIdentify } from '@/components/user/openpanel-identify'
import { UserBootstrap } from '@/components/user/user-bootstrap'

// Convex client: use real URL when set; otherwise placeholder so ConvexProvider is always present
// (avoids "useQuery must be used under ConvexProvider" during static prerender when env is missing, e.g. CI)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://build-placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

interface ProvidersProps {
  children: ReactNode
}

/**
 * App-level providers wrapper
 * Includes:
 * - Convex (database & auth)
 * - Theme management (next-themes)
 * - Analytics identity bridge (OpenPanel)
 * - Toast notifications (sonner)
 * - Keyboard shortcuts (power users)
 */
export function Providers({ children }: ProvidersProps) {
  // Skip automatic code handling when the OAuth callback is for the desktop app.
  // The DesktopAuthRelay component will relay the code via deep-link instead.
  const shouldHandleCode = useCallback(() => {
    if (typeof window === 'undefined') return true
    const params = new URLSearchParams(window.location.search)
    return params.get('source') !== 'desktop'
  }, [])

  const content = (
    <NuqsAdapter>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <KeyboardShortcutsProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              },
            }}
          />
        </KeyboardShortcutsProvider>
      </NextThemesProvider>
    </NuqsAdapter>
  )

  return (
    <ConvexAuthProvider client={convex} shouldHandleCode={shouldHandleCode}>
      <DesktopAuthRelay />
      <UserBootstrap />
      <OpenPanelIdentify />
      {content}
    </ConvexAuthProvider>
  )
}
