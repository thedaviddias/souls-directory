/**
 * Profile Content - Client Component
 *
 * Displays user profile and their souls.
 * Receives pre-fetched data from server component.
 */

'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SectionHeader } from '@/components/marketing/section-header'
import { CategoryBadge } from '@/components/shared/category-badge'
import { FeaturedBadge } from '@/components/shared/featured-badge'
import { useAnalytics } from '@/hooks/use-analytics'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { ROUTES, soulPathFrom } from '@/lib/routes'
import { getUserDisplayName, getUserImage, isUserVisible } from '@/lib/user-display'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, Calendar, Download, FileText, Globe, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

interface UserData {
  id: string
  name?: string
  handle?: string
  displayName?: string
  bio?: string
  image?: string
  websiteUrl?: string
  xHandle?: string
  mastodonHandle?: string
  blueskyHandle?: string
  githubHandle?: string
  role?: string
  createdAt?: number
  deletedAt?: number
}

interface SoulData {
  soul: {
    id: string
    slug: string
    ownerHandle: string
    name: string
    tagline: string
    downloads: number
    stars: number
    upvotes: number
    featured: boolean
    createdAt: number
    updatedAt: number
  }
  category: {
    slug: string
    name: string
    color: string
  } | null
}

interface ProfileContentProps {
  user: UserData
  souls: SoulData[]
}

export function ProfileContent({ user, souls }: ProfileContentProps) {
  const analytics = useAnalytics()
  const { me } = useAuthStatus()
  const isOwner = Boolean(me && user.id && me._id === user.id)

  useEffect(() => {
    if (isUserVisible(user) && user.handle) {
      analytics.track('profile_view', { handle: user.handle })
    }
  }, [analytics, user])

  // If user is deleted, show a 404-like message
  if (!isUserVisible(user)) {
    return (
      <div id="main-content" className="flex-1">
        <PageContainer>
          <div className="text-center py-20">
            <h1 className="text-xl font-medium text-text mb-2">User Not Found</h1>
            <p className="text-sm text-text-secondary">This user account has been deleted.</p>
          </div>
        </PageContainer>
      </div>
    )
  }

  const userImage = getUserImage(user)
  const displayName = getUserDisplayName(user)
  // Use name (from GitHub/auth) for heading, fall back to displayName then handle
  const headingName = user.name || user.displayName || user.handle || 'User'
  const githubUrl = user.githubHandle ? `https://github.com/${user.githubHandle}` : null

  return (
    <div id="main-content" className="flex-1">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ name: 'Members', href: ROUTES.members }, { name: displayName }]}
          className="mb-6"
        />

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          {/* Avatar */}
          {userImage ? (
            <Image
              src={userImage}
              alt={displayName}
              width={80}
              height={80}
              className="rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center text-2xl text-text font-mono">
              {(
                user.name?.charAt(0) ||
                user.displayName?.charAt(0) ||
                user.handle?.charAt(0) ||
                'U'
              ).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-xl font-medium text-text">{headingName}</h1>
            {user.handle && (
              <p className="text-sm text-text-muted font-mono mt-0.5">
                {githubUrl ? (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="hover:text-text transition-colors"
                  >
                    @{user.handle}
                  </a>
                ) : (
                  <>@{user.handle}</>
                )}
              </p>
            )}

            {user.bio ? (
              <p className="text-sm text-text-secondary mt-3 max-w-xl">{user.bio}</p>
            ) : isOwner ? (
              <p className="text-sm text-text-muted mt-3 max-w-xl">No bio yet</p>
            ) : null}

            {/* Links & Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-text-muted">
              {user.createdAt && (
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDistanceToNow(user.createdAt)} ago
                </span>
              )}
              <span className="flex items-center gap-1 font-mono">
                <FileText className="w-3.5 h-3.5" />
                {souls.length} {souls.length === 1 ? 'soul' : 'souls'}
              </span>
              {user.websiteUrl && (
                <a
                  href={user.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {user.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {user.xHandle && (
                <a
                  href={`https://x.com/${user.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @{user.xHandle}
                </a>
              )}
              {user.mastodonHandle &&
                (() => {
                  const atIndex = user.mastodonHandle.indexOf('@')
                  const userPart = atIndex >= 0 ? user.mastodonHandle.slice(0, atIndex) : ''
                  const instance = atIndex >= 0 ? user.mastodonHandle.slice(atIndex + 1) : ''
                  const mastodonUrl =
                    instance && userPart ? `https://${instance}/@${userPart}` : null
                  return mastodonUrl ? (
                    <a
                      href={mastodonUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Mastodon
                    </a>
                  ) : null
                })()}
              {user.blueskyHandle && (
                <a
                  href={`https://bsky.app/profile/${user.blueskyHandle}`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Bluesky
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Souls Section */}
        <section>
          <SectionHeader variant="label" title={`${headingName}'s Souls`} sticky={false} />

          {souls.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              {souls.map(({ soul, category }) => (
                <SoulCard key={soul.id} soul={soul} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface border border-border rounded-lg">
              <p className="text-sm text-text-secondary">
                {displayName} hasn&apos;t published any souls yet.
              </p>
            </div>
          )}
        </section>
      </PageContainer>
    </div>
  )
}

function SoulCard({
  soul,
  category,
}: {
  soul: SoulData['soul']
  category: SoulData['category']
}) {
  return (
    <Link
      href={soulPathFrom(soul)}
      className="block bg-surface border border-border rounded-lg p-4 hover:border-text-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-text">{soul.name}</h3>
        {soul.featured && <FeaturedBadge />}
      </div>

      <p className="text-xs text-text-secondary mb-4 line-clamp-2">{soul.tagline}</p>

      <div className="flex items-center justify-between">
        {category && (
          <CategoryBadge category={{ slug: category.slug, name: category.name }} size="sm" />
        )}
        <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
          <span className="flex items-center gap-1" aria-label={`${soul.downloads} downloads`}>
            <Download className="w-3 h-3" aria-hidden />
            {soul.downloads}
          </span>
          <span className="flex items-center gap-1" aria-label={`${soul.stars} stars`}>
            <Star className="w-3 h-3" aria-hidden />
            {soul.stars}
          </span>
          <span className="flex items-center gap-1" aria-label={`${soul.upvotes} upvotes`}>
            <ArrowUp className="w-3 h-3" aria-hidden />
            {soul.upvotes}
          </span>
        </div>
      </div>
    </Link>
  )
}
