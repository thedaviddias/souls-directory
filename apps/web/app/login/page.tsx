/**
 * Login Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 */

import { LoginContent } from '@/components/auth/login-content'
import { createAuthPageMetadata } from '@/lib/seo'
import { Suspense } from 'react'

export const metadata = createAuthPageMetadata(
  'Sign In',
  'Sign in to souls.directory to share and manage your AI personality templates.'
)

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-lg font-medium text-text">Sign in</h1>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
