/**
 * Soul Detail Content - Client Component
 *
 * Receives pre-fetched data from server component.
 * Handles user interactions (copy, download, star, upvote).
 */

'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SectionHeader } from '@/components/marketing/section-header'
import { CategoryBadge } from '@/components/shared/category-badge'
import { ModelBadges } from '@/components/shared/model-badge'
import { ShareMenuItems } from '@/components/shared/share-menu-items'
import { SoulCard } from '@/components/souls/soul-card'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'
import { SoulComments } from '@/components/souls/soul-comments'
import { SoulShowcases } from '@/components/souls/soul-showcases'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Id } from '@/convex/_generated/dataModel'
import { useAnalytics } from '@/hooks/use-analytics'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import {
  ROUTES,
  getSoulHandle,
  profilePath,
  soulPathFrom,
  soulsByCategoryPath,
  soulsByTagPath,
} from '@/lib/routes'
import { getUserDisplayName } from '@/lib/user-display'
import { cn } from '@/lib/utils'
import type { Soul } from '@/types'
import { useMutation, useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUp,
  Check,
  Clipboard,
  Download,
  GitFork,
  MoreHorizontal,
  Pencil,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface SoulData {
  forkedFrom: { slug: string; ownerHandle?: string | null; name: string } | null
  soul: {
    id: string
    slug: string
    ownerHandle?: string | null
    name: string
    tagline: string
    description: string
    stats: {
      downloads: number
      stars: number
      upvotes: number
      versions: number
      comments: number
      views: number
    }
    testedWithModels: string[]
    featured: boolean
    createdAt: number
    updatedAt: number
  }
  owner: {
    id: string
    handle?: string
    displayName?: string
    deletedAt?: number
  } | null
  category: {
    id: string
    slug: string
    name: string
    description: string
    icon: string
    color: string
  } | null
  tags: Array<{
    id: string
    slug: string
    name: string
  }>
  relatedSouls: Soul[]
  authorSouls: Soul[]
  versionHistory: Array<{
    _id: string
    version: string
    versionNumber: number
    changelog: string
    createdAt: number
  }>
  shareUrl: string
  content: string
}

interface SoulDetailContentProps {
  data: SoulData
}

export function SoulDetailContent({ data }: SoulDetailContentProps) {
  const router = useRouter()
  const analytics = useAnalytics()
  const { me, isAuthenticated } = useAuthStatus()
  const {
    forkedFrom,
    soul,
    owner,
    category,
    tags,
    relatedSouls,
    authorSouls,
    versionHistory,
    shareUrl,
    content,
  } = data

  // Cast soul.id to the correct Convex Id type
  const soulId = soul.id as Id<'souls'>

  // Check if current user is the owner
  const isOwner = isAuthenticated && me?._id === owner?.id

  // Fetch user-specific data (star/upvote status) - only on client
  const isStarred = useQuery(api.souls.isStarred, { soulId })
  const isUpvoted = useQuery(api.soulActions.isUpvoted, { soulId })

  // Mutations
  const toggleStar = useMutation(api.souls.toggleStar)
  const toggleUpvote = useMutation(api.soulActions.toggleUpvote)
  const trackDownload = useMutation(api.souls.trackDownload)
  // COLLECTIONS_DISABLED: re-enable when collections feature is turned back on
  // const myCollections = useQuery(api.collections.listMine)
  // const addToCollection = useMutation(api.collections.addSoul)

  // Local state for copy buttons
  const [copied, setCopied] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error('Failed to copy soul content', error, { soulSlug: soul.slug })
      toast.error('Failed to copy')
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (!content) return
    try {
      // Track download (Convex + Plausible)
      await trackDownload({ handle: getSoulHandle(soul, owner), slug: soul.slug })
      analytics.track('soul_download', { slug: soul.slug })

      // Create and download file
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'SOUL.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Downloaded SOUL.md')
    } catch (error) {
      logger.error('Soul download failed', error, { soulSlug: soul.slug })
      toast.error('Download failed')
    }
  }

  // Handle curl command copy (for OpenClaw)
  const handleCopyCurl = async () => {
    const soulSegment = `${getSoulHandle(soul, owner)}/${soul.slug}`
    const curlCommand = `curl https://souls.directory/api/souls/${soulSegment}.md > ~/.openclaw/workspace/SOUL.md`
    try {
      await navigator.clipboard.writeText(curlCommand)
      setCopiedCurl(true)
      toast.success('Curl command copied')
      setTimeout(() => setCopiedCurl(false), 2000)
    } catch (error) {
      logger.error('Failed to copy curl command', error, { soulSlug: soul.slug })
      toast.error('Failed to copy')
    }
  }

  // Handle star toggle
  const handleStar = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save favorites')
      router.push(ROUTES.login)
      return
    }
    try {
      const result = await toggleStar({ soulId })
      if (result.starred) {
        analytics.track('soul_star', { slug: soul.slug })
      }
      toast.success(result.starred ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      logger.error('Failed to update favorites', error, { soulSlug: soul.slug })
      toast.error('Failed to update favorites')
    }
  }

  // Handle upvote toggle
  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to upvote')
      router.push(ROUTES.login)
      return
    }
    try {
      const result = await toggleUpvote({ soulId })
      toast.success(result.upvoted ? 'Upvoted!' : 'Upvote removed')
    } catch (error) {
      logger.error('Failed to update vote', error, { soulSlug: soul.slug })
      toast.error('Failed to update vote')
    }
  }

  // COLLECTIONS_DISABLED: re-enable when collections feature is turned back on
  // const handleAddToCollection = async (collectionId: Id<'collections'>) => {
  //   if (!isAuthenticated) { router.push(ROUTES.login); return }
  //   try {
  //     await addToCollection({ collectionId, soulId })
  //     toast.success('Added to collection')
  //   } catch (error) {
  //     const msg = error instanceof Error ? error.message : 'Failed to add'
  //     if (msg.includes('already in collection')) toast.info('Already in this collection')
  //     else toast.error(msg)
  //   }
  // }

  return (
    <main className="min-h-screen">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ name: 'Souls', href: ROUTES.souls }, { name: soul.name }]}
          className="mb-8"
        />

        {/* Header: title, tagline, actions, then stats + meta in one compact block */}
        <header className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-medium text-text truncate" title={soul.name}>
                  {soul.name}
                </h1>
                {isOwner && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    title="Edit this soul"
                  >
                    <Link href={ROUTES.uploadEdit(getSoulHandle(soul, owner), soul.slug)}>
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">{soul.tagline}</p>
              {forkedFrom && (
                <p className="text-xs text-text-muted mt-2">
                  Based on{' '}
                  <Link
                    href={soulPathFrom({
                      ownerHandle: forkedFrom.ownerHandle ?? '',
                      slug: forkedFrom.slug,
                    })}
                    className="text-text-secondary hover:text-text underline-offset-2 hover:underline"
                  >
                    {forkedFrom.name}
                  </Link>
                </p>
              )}
            </div>

            {/* Action Bar: Download, Upvote, Save + overflow menu */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                title="Download SOUL.md"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUpvote}
                className={cn(
                  isUpvoted &&
                    'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                )}
                title={
                  isAuthenticated
                    ? isUpvoted
                      ? 'Remove upvote'
                      : 'Upvote this soul'
                    : 'Sign in to upvote'
                }
              >
                <ArrowUp className={`w-3.5 h-3.5 ${isUpvoted ? 'stroke-[2.5]' : ''}`} />
                <span className="hidden sm:inline">{isUpvoted ? 'Upvoted' : 'Upvote'}</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleStar}
                className={cn(
                  isStarred &&
                    'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                )}
                title={
                  isAuthenticated
                    ? isStarred
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                    : 'Sign in to save favorites'
                }
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isStarred ? 'Saved' : 'Save'}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="More actions"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <Link
                      href={ROUTES.uploadFork(getSoulHandle(soul, owner), soul.slug)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <GitFork className="w-4 h-4" aria-hidden />
                      <span>Fork and remix</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ShareMenuItems title={soul.name} text={soul.tagline} shareUrl={shareUrl} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats + meta: one compact block, minimal gaps */}
          <div className="space-y-1.5 text-sm text-text-secondary">
            <div className="font-mono tabular-nums">
              <span>{soul.stats.downloads.toLocaleString()} downloads</span>
              <span className="text-border mx-1.5" aria-hidden>
                ·
              </span>
              <span>{soul.stats.stars.toLocaleString()} stars</span>
              <span className="text-border mx-1.5" aria-hidden>
                ·
              </span>
              <span>{soul.stats.upvotes.toLocaleString()} upvotes</span>
            </div>
            {(soul.testedWithModels?.length ||
              category ||
              tags.length > 0 ||
              owner ||
              soul.updatedAt) && (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-text-muted">
                {soul.testedWithModels?.length ? (
                  <>
                    <span className="text-text-muted">Tested with</span>
                    <ModelBadges models={soul.testedWithModels} />
                  </>
                ) : null}
                {soul.testedWithModels?.length &&
                (category || tags.length > 0 || owner || soul.updatedAt) ? (
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                ) : null}
                {category && (
                  <CategoryBadge
                    category={category}
                    size="sm"
                    href={soulsByCategoryPath(category.slug)}
                  />
                )}
                {category && (tags.length > 0 || owner || soul.updatedAt) && (
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                )}
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={soulsByTagPath(tag.slug)}
                    className="px-2 py-0.5 rounded border border-border text-text-secondary hover:text-text hover:border-text-muted transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
                {tags.length > 0 && (owner || soul.updatedAt) && (
                  <span className="text-border" aria-hidden>
                    ·
                  </span>
                )}
                {owner && (
                  <>
                    <span>
                      by{' '}
                      {owner.handle && !owner.deletedAt ? (
                        <Link
                          href={profilePath(owner.handle)}
                          className="text-text hover:text-text/90 transition-colors underline-offset-4 hover:underline"
                        >
                          {getUserDisplayName(owner)}
                        </Link>
                      ) : (
                        <span className="text-text-secondary">{getUserDisplayName(owner)}</span>
                      )}
                    </span>
                    {soul.updatedAt && (
                      <span className="text-border" aria-hidden>
                        ·
                      </span>
                    )}
                  </>
                )}
                {soul.updatedAt && <span>Updated {formatDistanceToNow(soul.updatedAt)} ago</span>}
              </div>
            )}
          </div>
        </header>

        {/* Description */}
        {soul.description && (
          <section className="mb-12">
            <SectionHeader variant="label" title="About" />
            <p className="text-sm text-text-secondary leading-relaxed mt-4">{soul.description}</p>
          </section>
        )}

        {/* Quick Install / Curl Command */}
        <section className="mb-12">
          <SectionHeader variant="label" title="Quick Install" />
          <div className="relative group">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyCurl}
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100"
              title="Copy command"
            >
              {copiedCurl ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
              <span>{copiedCurl ? 'Copied!' : 'Copy'}</span>
            </Button>
            <div className="p-3 rounded-lg bg-surface border border-border font-mono text-sm overflow-x-auto">
              <span className="text-text-secondary select-none">$ </span>
              <span className="text-text-secondary">
                curl https://souls.directory/api/souls/{getSoulHandle(soul, owner)}/{soul.slug}.md
                &gt; ~/.openclaw/workspace/SOUL.md
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            Copy this command to download the soul directly to your OpenClaw workspace.
          </p>
        </section>

        {/* Content with inline copy */}
        {content && (
          <section className="mb-12">
            <SectionHeader variant="label" title="SOUL.md" />

            <div className="relative group">
              {/* Copy button - always visible with SOUL.md content */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="absolute top-3 right-3 z-10 bg-surface"
                title="Copy content"
              >
                {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>

              {/* Code block */}
              <pre className="p-4 rounded-lg bg-surface border border-border overflow-x-auto">
                <code className="text-sm text-text-secondary font-mono whitespace-pre-wrap wrap-break-word">
                  {content}
                </code>
              </pre>
            </div>
          </section>
        )}

        {/* Version history */}
        {versionHistory.length > 0 && (
          <section className="mb-12">
            <SectionHeader variant="label" title="Version History" />
            <ol className="mt-4 space-y-2 list-none">
              {versionHistory.map((v) => (
                <li
                  key={v._id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-text-secondary"
                >
                  <span className="font-mono text-text">v{v.version}</span>
                  {v.changelog && <span className="text-text-muted">— {v.changelog}</span>}
                  <span className="text-text-muted">{formatDistanceToNow(v.createdAt)} ago</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Showcases */}
        <SoulShowcases
          soulId={soulId}
          soulSlug={soul.slug}
          ownerHandle={soul.ownerHandle}
          soulOwnerId={owner?.id as Id<'users'> | undefined}
          mode="preview"
        />

        {/* Comments */}
        <SoulComments
          soulId={soulId}
          soulSlug={soul.slug}
          ownerHandle={soul.ownerHandle}
          mode="preview"
        />

        {/* Related souls */}
        {relatedSouls.length > 0 && (
          <section className="mb-12">
            <SectionHeader variant="label" title="Related Souls" spacing="large" />
            <SoulCardGrid>
              {relatedSouls.map((s) => (
                <SoulCard key={s.id} soul={s} />
              ))}
            </SoulCardGrid>
          </section>
        )}

        {/* More from this author */}
        {authorSouls.length > 0 && owner && (
          <section className="mb-12">
            <SectionHeader
              variant="label"
              title={`More from ${getUserDisplayName(owner)}`}
              spacing="large"
              viewAllHref={owner.handle && !owner.deletedAt ? profilePath(owner.handle) : undefined}
              viewAllText="View profile"
            />
            <SoulCardGrid>
              {authorSouls.map((s) => (
                <SoulCard key={s.id} soul={s} />
              ))}
            </SoulCardGrid>
          </section>
        )}
      </PageContainer>
    </main>
  )
}
