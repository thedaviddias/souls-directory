'use client'

import { KeyboardShortcutsProvider } from '@/components/shortcuts/keyboard-shortcuts-provider'
import { UserBootstrap } from '@/components/user/user-bootstrap'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import PlausibleProvider from 'next-plausible'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

// Initialize Convex client (only if URL is configured)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

interface ProvidersProps {
  children: ReactNode
}

/**
 * App-level providers wrapper
 * Includes:
 * - Convex (database & auth)
 * - Theme management (next-themes)
 * - Analytics (Plausible)
 * - Toast notifications (sonner)
 * - Keyboard shortcuts (power users)
 */
export function Providers({ children }: ProvidersProps) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'souls.directory'
  const enabled = process.env.NODE_ENV === 'production'

  const content = (
    <NuqsAdapter>
      <PlausibleProvider domain={domain} enabled={enabled} trackOutboundLinks>
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
      </PlausibleProvider>
    </NuqsAdapter>
  )

  // Wrap with Convex if configured
  if (convex) {
    return (
      <ConvexAuthProvider client={convex}>
        <UserBootstrap />
        {content}
      </ConvexAuthProvider>
    )
  }

  return content
}
