'use client'

import { Button } from '@/components/ui/button'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/lib/routes'
import { useAuthActions } from '@convex-dev/auth/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LoginContent() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStatus()
  const { signIn } = useAuthActions()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace(ROUTES.dashboard)
    }
  }, [isAuthenticated, isLoading, router])

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn('github', { redirectTo: ROUTES.dashboard })
    } catch (error) {
      logger.error('Sign in failed', error)
      setIsSigningIn(false)
    }
  }

  // Show loading state while checking auth
  if (isLoading || isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <span className="font-mono text-sm font-bold text-text">souls.directory</span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-medium text-text mb-2">Sign in</h1>
          <p className="text-sm text-text-secondary mb-8">Join the community. Share your souls.</p>

          {/* GitHub Sign In Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleGitHubSignIn}
            loading={isSigningIn}
            loadingText="Signing in..."
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </Button>

          {/* Terms */}
          <p className="mt-6 text-xs text-text-muted leading-relaxed">
            By signing in, you agree to our{' '}
            <Link
              href={ROUTES.terms as Route}
              className="text-text-secondary hover:text-text transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href={ROUTES.privacy as Route}
              className="text-text-secondary hover:text-text transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href={ROUTES.home}
            className="text-xs text-text-secondary hover:text-text transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
