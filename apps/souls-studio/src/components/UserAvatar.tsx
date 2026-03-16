import { Loader2, LogOut, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSoulAuth } from '../hooks/useSoulAuth'
import { getConfiguredConvexUrl } from '../lib/convex-config'
import { signInExternal } from '../lib/tauri-auth'

const LOADING_TIMEOUT_MS = 5000
const SIGN_IN_TIMEOUT_MS = 10000

function userInitials(label: string) {
  const parts = label.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return label.slice(0, 2).toUpperCase()
}

export function UserAvatar() {
  const convexConfigured = !!getConfiguredConvexUrl()
  const { me, isLoading, isAuthenticated, signIn, signOut } = useSoulAuth(convexConfigured)
  const [open, setOpen] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const userLabel = me?.displayName ?? me?.handle ?? me?.githubHandle ?? me?.name ?? 'User'
  const userHandle = me?.githubHandle ?? me?.handle

  // Timeout for initial loading state
  useEffect(() => {
    if (!isLoading) {
      setLoadingTimedOut(false)
      return
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isLoading])

  // Timeout for sign-in flow
  useEffect(() => {
    if (!signingIn) return
    const timer = setTimeout(() => setSigningIn(false), SIGN_IN_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [signingIn])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInExternal(signIn, 'github')
    } catch {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
  }

  // Show loading spinner briefly, then fall back to logged-out icon
  if (isLoading && !loadingTimedOut) {
    return (
      <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!isAuthenticated || !me) {
    return (
      <button
        onClick={() => void handleSignIn()}
        disabled={signingIn}
        className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors disabled:opacity-50"
        title="Sign in with GitHub"
      >
        {signingIn ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
        ) : (
          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ backgroundColor: 'var(--accent)' }}
        title={userLabel}
      >
        <span className="text-[10px] font-semibold text-white leading-none">
          {userInitials(userLabel)}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[200px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ animation: 'fadeInScale 0.15s ease-out' }}
        >
          <div className="px-3 py-3">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userLabel}</p>
            {userHandle && (
              <p className="text-xs text-[var(--text-muted)] truncate">@{userHandle}</p>
            )}
          </div>
          <div className="border-t border-[var(--border)]">
            <button
              onClick={() => void handleSignOut()}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
