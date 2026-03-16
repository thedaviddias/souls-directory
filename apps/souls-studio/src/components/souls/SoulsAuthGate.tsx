import { Github, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useSoulAuth } from '../../hooks/useSoulAuth'
import { saveConfiguredConvexUrl } from '../../lib/convex-config'
import type { MeUser } from '../../lib/souls-convex-api'
import { isTauriRuntime, openExternalUrl } from '../../lib/tauri'
import { signInExternal } from '../../lib/tauri-auth'

interface SoulsAuthGateProps {
  convexUrlConfigured: boolean
  children: (auth: { me: MeUser; signOut: () => Promise<void> }) => React.ReactNode
}

export function SoulsAuthGate({ convexUrlConfigured, children }: SoulsAuthGateProps) {
  const { me, isLoading, isAuthenticated, signIn, signOut } = useSoulAuth(convexUrlConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [convexUrlInput, setConvexUrlInput] = useState('')
  const [convexSetupError, setConvexSetupError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      await signInExternal(signIn, 'github')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error))
      setIsSigningIn(false)
    }
  }

  const handleOpenGithub = async () => {
    await openExternalUrl('https://github.com/login')
  }

  const handleSaveConvexUrl = () => {
    setConvexSetupError(null)

    try {
      const parsed = new URL(convexUrlInput.trim())
      if (!parsed.protocol.startsWith('http') || !parsed.hostname) {
        setConvexSetupError('Please paste a valid deployment URL.')
        return
      }

      saveConfiguredConvexUrl(parsed.toString())
      window.location.reload()
    } catch {
      setConvexSetupError('Invalid URL format.')
    }
  }

  if (!convexUrlConfigured) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="max-w-xl px-8 py-10 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Souls module requires backend setup
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Set your deployment URL below (saved locally in this app).
          </p>
          <div className="mt-4 space-y-2">
            <input
              value={convexUrlInput}
              onChange={(event) => setConvexUrlInput(event.target.value)}
              placeholder="https://your-project.example.cloud"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={handleSaveConvexUrl}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium"
            >
              Save URL
            </button>
            {convexSetupError && <p className="text-xs text-red-500">{convexSetupError}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!isAuthenticated || !me) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-secondary)] p-6">
        <div className="w-full max-w-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Sign in to sync souls
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Use the same GitHub account as souls.directory to sync local and remote souls.
          </p>
          {isSigningIn && isTauriRuntime() ? (
            <>
              <div className="mt-5 flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  Complete sign-in in your browser
                </p>
                <p className="text-xs text-[var(--text-muted)] text-center">
                  A browser window has opened. Return here after signing in.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsSigningIn(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignIn}
                  className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="mt-5 w-full px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium flex items-center justify-center gap-2"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Github className="w-4 h-4" />
                )}
                {isSigningIn ? 'Opening GitHub...' : 'Continue with GitHub'}
              </button>
              <button
                onClick={handleOpenGithub}
                className="mt-2 w-full px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-sm"
              >
                Open github.com in browser
              </button>
            </>
          )}
          {authError && <p className="mt-3 text-xs text-red-500">{authError}</p>}
        </div>
      </div>
    )
  }

  return <>{children({ me, signOut })}</>
}
