/**
 * Header - Minimalist navigation header
 *
 * Design: Typography-first, grayscale palette
 * - Monospace text logo on the left
 * - Nav links in the center/right
 * - GitHub stars widget + prominent Sign Up button
 * - Height h-16
 */

'use client'

import { useCollectionsEnabled } from '@/components/flags-provider'
import { SearchAutocomplete } from '@/components/search/search-autocomplete'
import { GithubStars } from '@/components/shared/github-stars'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { LayoutDashboard, Loader2, LogOut, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ROUTES, profilePath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { Route } from 'next'

interface NavItem {
  href: Route
  label: string
}

const allNavItems: NavItem[] = [
  { href: ROUTES.souls, label: 'Souls' },
  { href: ROUTES.collections, label: 'Collections' },
  { href: ROUTES.guides, label: 'Guides' },
  { href: ROUTES.members, label: 'Members' },
]

const SCROLL_TOP_THRESHOLD = 64
const SCROLL_DELTA_THRESHOLD = 10

// User avatar component with fallback
function UserAvatar({
  user,
  size = 'sm',
}: {
  user: { image?: string; displayName?: string; handle?: string } | null
  size?: 'sm' | 'md'
}) {
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.displayName || user.handle || 'User avatar'}
        className={`${sizeClasses} rounded-full object-cover border border-border`}
      />
    )
  }

  // Fallback to initials
  const initials = user?.displayName?.charAt(0) || user?.handle?.charAt(0) || 'U'
  return (
    <div
      className={`${sizeClasses} rounded-full bg-surface border border-border flex items-center justify-center text-text font-medium`}
    >
      {initials.toUpperCase()}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { me, isLoading, isAuthenticated, signOut } = useAuthStatus()
  const collectionsEnabled = useCollectionsEnabled()
  const navItems = allNavItems.filter(
    (item) => item.href !== ROUTES.collections || collectionsEnabled
  )

  const isHomepage = pathname === '/'

  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    // Sync ref to actual scroll position so first scroll event doesn't use delta from 0
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const scrollY = window.scrollY
      const delta = scrollY - lastScrollY.current

      if (scrollY < SCROLL_TOP_THRESHOLD) {
        setHeaderVisible(true)
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setHeaderVisible(false)
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        setHeaderVisible(true)
      }

      lastScrollY.current = scrollY
    }

    const onScroll = () => {
      if (rafId.current !== null) return
      rafId.current = requestAnimationFrame(() => {
        handleScroll()
        rafId.current = null
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push(ROUTES.home)
  }

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-text focus:text-bg focus:rounded-md focus:font-medium"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          'sticky top-0 z-50 backdrop-blur-lg bg-bg/80 border-b border-border/50',
          'transition-[transform] duration-200 ease-out',
          !headerVisible && '-translate-y-full'
        )}
      >
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo - Monospace text only */}
          <Link
            href={ROUTES.home}
            aria-label="souls.directory - Home"
            className="font-mono text-sm font-bold text-text hover:text-text-secondary transition-colors whitespace-nowrap shrink-0"
          >
            souls.directory
          </Link>

          {/* Search - hidden on homepage */}
          {!isHomepage && (
            <SearchAutocomplete
              compact
              placeholder="Search souls..."
              className="hidden sm:block w-full max-w-xs"
            />
          )}

          {/* Navigation + Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === ROUTES.guides && pathname.startsWith('/guides'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      isActive ? 'text-text' : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* GitHub stars widget */}
            <GithubStars />

            {/* Auth Section */}
            {isLoading ? (
              <div className="px-3 py-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
              </div>
            ) : isAuthenticated && me ? (
              <>
                <Button asChild variant="primary" size="sm">
                  <Link href={ROUTES.upload}>
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Submit</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full focus:outline-none focus:ring-1 focus:ring-text-secondary"
                      aria-label="User menu"
                    >
                      <UserAvatar user={me} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-surface border-border">
                    {me.handle ? (
                      <Link
                        href={profilePath(me.handle)}
                        className="block focus:outline-none group"
                      >
                        <DropdownMenuLabel className="font-normal cursor-pointer hover:bg-border/50 rounded-sm transition-colors">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none text-text group-hover:underline">
                              {me.displayName || me.handle}
                            </p>
                            {me.email && (
                              <p className="text-xs leading-none text-text-secondary">{me.email}</p>
                            )}
                          </div>
                        </DropdownMenuLabel>
                      </Link>
                    ) : (
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-text">
                            {me.displayName || me.handle}
                          </p>
                          {me.email && (
                            <p className="text-xs leading-none text-text-secondary">{me.email}</p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                    )}
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link
                        href={ROUTES.dashboard}
                        className="cursor-pointer text-text-secondary hover:text-text"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={ROUTES.settings}
                        className="cursor-pointer text-text-secondary hover:text-text"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-error focus:text-error"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link href={ROUTES.login}>Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
