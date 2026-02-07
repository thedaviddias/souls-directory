'use client'

/**
 * Tweet showcases for a soul: users submit tweet URLs (screenshots of AI conversations).
 * Preview mode shows 3 tweets + "View all"; full mode shows paginated grid.
 */

import { SectionHeader } from '@/components/marketing/section-header'
import { Button } from '@/components/ui/button'
import type { Id } from '@/convex/_generated/dataModel'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { ROUTES, soulShowcasesPath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import type { TwitterComponents } from 'react-tweet'
import { Tweet, TweetSkeleton } from 'react-tweet'
import { toast } from 'sonner'

interface ShowcaseItem {
  showcase: {
    _id: Id<'showcases'>
    soulId: Id<'souls'>
    userId: Id<'users'>
    tweetId: string
    tweetUrl: string
    note?: string
    createdAt: number
  }
  author: {
    _id: Id<'users'>
    handle?: string
    displayName?: string
    image?: string
  } | null
}

interface SoulShowcasesProps {
  soulId: Id<'souls'>
  soulSlug: string
  ownerHandle?: string | null
  /** Soul owner user id (for remove permission) */
  soulOwnerId?: Id<'users'>
  mode?: 'preview' | 'full'
}

function TweetNotFoundFallback({ tweetUrl }: { tweetUrl: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center">
      <p className="text-sm text-text-muted mb-3">
        This tweet could not be loaded. It may have been deleted or is from a private account.
      </p>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
      >
        View on X <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

function TweetCard({ tweetId, tweetUrl }: { tweetId: string; tweetUrl: string }) {
  const tweetComponents: TwitterComponents = {
    TweetNotFound: () => <TweetNotFoundFallback tweetUrl={tweetUrl} />,
  }

  return (
    <div data-theme="dark" className="min-w-0 [&_.react-tweet-theme]:overflow-hidden">
      <Suspense fallback={<TweetSkeleton />}>
        <Tweet id={tweetId} components={tweetComponents} />
      </Suspense>
    </div>
  )
}

export function SoulShowcases({
  soulId,
  soulSlug,
  ownerHandle,
  soulOwnerId,
  mode = 'preview',
}: SoulShowcasesProps) {
  const router = useRouter()
  const { me, isAuthenticated } = useAuthStatus()
  const usePreview = mode === 'preview' && ownerHandle != null

  const previewResult = useQuery(api.showcases.preview, usePreview ? { soulId } : 'skip')
  const paginatedResult = useQuery(
    api.showcases.listPaginated,
    !usePreview ? { soulId, limit: 12 } : 'skip'
  )
  const [paginatedCursor, setPaginatedCursor] = useState<number | undefined>(undefined)
  const paginatedWithCursor = useQuery(
    api.showcases.listPaginated,
    !usePreview && paginatedCursor != null ? { soulId, cursor: paginatedCursor, limit: 12 } : 'skip'
  )

  const [accumulatedItems, setAccumulatedItems] = useState<ShowcaseItem[]>([])
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined)

  const addShowcase = useMutation(api.showcases.add)
  const removeShowcase = useMutation(api.showcases.remove)

  const [tweetUrl, setTweetUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewItems = (previewResult?.items ?? []) as ShowcaseItem[]
  const previewTotal = previewResult?.totalCount ?? 0
  const firstPage = (paginatedResult?.items ?? []) as ShowcaseItem[]
  const firstPageNext = paginatedResult?.nextCursor
  const firstPageTotal = paginatedResult?.totalCount ?? 0
  const morePage = (paginatedWithCursor?.items ?? []) as ShowcaseItem[]

  const items: ShowcaseItem[] = usePreview
    ? previewItems
    : paginatedCursor == null
      ? firstPage
      : accumulatedItems
  const totalCount = usePreview ? previewTotal : firstPageTotal

  // Sync accumulated for full mode: first page then append on Load more
  useEffect(() => {
    if (usePreview) return
    if (paginatedCursor == null) {
      setAccumulatedItems(firstPage)
      setNextCursor(firstPageNext ?? undefined)
    } else if (paginatedWithCursor != null) {
      setAccumulatedItems((prev) => [...prev, ...morePage])
      setNextCursor(paginatedWithCursor.nextCursor ?? undefined)
    }
  }, [usePreview, paginatedCursor, firstPage, firstPageNext, paginatedWithCursor, morePage])

  const hasMore = !usePreview && nextCursor != null

  const canRemove = (item: ShowcaseItem) => {
    if (!me) return false
    if (item.showcase.userId === me._id) return true
    if (soulOwnerId && me._id === soulOwnerId) return true
    if (me.role === 'admin' || me.role === 'moderator') return true
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push(ROUTES.login as Route)
      return
    }
    const url = tweetUrl.trim()
    if (!url) return
    setIsSubmitting(true)
    try {
      await addShowcase({ soulId, tweetUrl: url })
      setTweetUrl('')
      toast.success('Showcase added')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add showcase'
      toast.error(msg)
      logger.error('Showcase add failed', err, { soulSlug })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (showcaseId: Id<'showcases'>) => {
    try {
      await removeShowcase({ showcaseId })
      toast.success('Showcase removed')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove'
      toast.error(msg)
    }
  }

  return (
    <section className="mb-12">
      <SectionHeader
        variant="label"
        title={totalCount === 0 ? 'Showcases' : `Showcases (${totalCount})`}
        viewAllHref={
          usePreview && totalCount > items.length && ownerHandle
            ? soulShowcasesPath(ownerHandle, soulSlug)
            : undefined
        }
        viewAllText={
          usePreview && totalCount > items.length ? `View all ${totalCount} showcases` : undefined
        }
      />

      <div className="mt-4 mb-8 rounded-lg border border-border bg-surface/50 px-6 py-5">
        <p className="text-sm text-text-secondary mb-4">
          Tried this soul? Tweet a screenshot of your conversation and paste the link below.
        </p>
        {isAuthenticated ? (
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <label htmlFor="showcase-tweet-url" className="sr-only">
                Tweet URL
              </label>
              <input
                id="showcase-tweet-url"
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://x.com/username/status/..."
                aria-label="Tweet URL"
                className="flex-1 min-w-0 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text-muted"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!tweetUrl.trim() || isSubmitting}
                aria-busy={isSubmitting}
              >
                Add showcase
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-text-muted">
            <Link href={ROUTES.login as Route} className="text-text-secondary hover:underline">
              Sign in
            </Link>{' '}
            to share a showcase.
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-muted">
          No showcases yet. Try this soul and share a screenshot of your conversation.
        </p>
      ) : (
        <div
          className={cn(
            'grid gap-6 justify-items-center',
            mode === 'full'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {items.map((item) => (
            <div key={item.showcase._id} className="relative min-w-0 w-full max-w-[550px]">
              <div className="relative">
                <TweetCard tweetId={item.showcase.tweetId} tweetUrl={item.showcase.tweetUrl} />
                {canRemove(item) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-8 w-8 opacity-80 hover:opacity-100"
                    aria-label="Remove showcase"
                    onClick={() => handleRemove(item.showcase._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPaginatedCursor(nextCursor ?? undefined)}
          >
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
