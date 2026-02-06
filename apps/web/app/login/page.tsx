/**
 * Login Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 */

import { LoginContent } from '@/components/auth/login-content'
import { createAuthPageMetadata } from '@/lib/seo'

export const metadata = createAuthPageMetadata(
  'Sign In',
  'Sign in to souls.directory to share and manage your AI personality templates.'
)

export default function LoginPage() {
  return <LoginContent />
}
