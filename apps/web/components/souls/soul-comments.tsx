'use client'

/**
 * Threaded comments for a soul detail page.
 * Uses Convex comments.list, comments.add, comments.remove.
 */

import { SectionHeader } from '@/components/marketing/section-header'
import { Button } from '@/components/ui/button'
import type { Id } from '@/convex/_generated/dataModel'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { ROUTES, profilePath, soulCommentsPath } from '@/lib/routes'
import { getUserDisplayName } from '@/lib/user-display'
import Image from 'next/image'

const COMMENT_CHAR_LIMIT = 2000

function getInitials(
  author: { displayName?: string; name?: string; handle?: string } | null
): string {
  if (!author) return '?'
  const name = author.displayName ?? author.name ?? author.handle ?? ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? ''
    const last = parts[parts.length - 1]?.charAt(0) ?? ''
    return (first + last).toUpperCase().slice(0, 2)
  }
  return name.slice(0, 2).toUpperCase() || '?'
}

function CommentAvatar({
  author,
  size = 32,
}: {
  author: {
    _id: Id<'users'>
    displayName?: string
    name?: string
    handle?: string
    image?: string
  } | null
  size?: number
}) {
  const initials = getInitials(author)
  if (author?.image) {
    return (
      <Image
        src={author.image}
        alt=""
        width={size}
        height={size}
        className="rounded-full shrink-0 bg-surface"
      />
    )
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-text-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
import { useMutation, useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import { Flag, MessageCircle, Send, Trash2 } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type CommentItem = {
  comment: {
    _id: Id<'comments'>
    body: string
    parentCommentId?: Id<'comments'>
    createdAt: number
    updatedAt?: number
  }
  author: {
    _id: Id<'users'>
    handle?: string
    displayName?: string
    image?: string
  } | null
}

function buildCommentTree(items: CommentItem[]) {
  const byId = new Map<Id<'comments'>, CommentItem & { replies: CommentItem[] }>()
  for (const item of items) {
    byId.set(item.comment._id, { ...item, replies: [] })
  }
  const roots: (CommentItem & { replies: CommentItem[] })[] = []
  for (const item of items) {
    const node = byId.get(item.comment._id)
    if (!node) continue
    if (item.comment.parentCommentId) {
      const parent = byId.get(item.comment.parentCommentId)
      if (parent) parent.replies.push(item)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  }
  roots.sort((a, b) => a.comment.createdAt - b.comment.createdAt)
  for (const node of byId.values()) {
    node.replies.sort((a, b) => a.comment.createdAt - b.comment.createdAt)
  }
  return roots
}

interface SoulCommentsProps {
  soulId: Id<'souls'>
  soulSlug: string
  /** When set, use preview (3 comments) and show "View all N comments" link to dedicated page */
  ownerHandle?: string | null
  /** When 'full', use paginated list and "Load more" on dedicated comments page */
  mode?: 'preview' | 'full'
}

export function SoulComments({
  soulId,
  soulSlug,
  ownerHandle,
  mode = 'preview',
}: SoulCommentsProps) {
  const router = useRouter()
  const { me, isAuthenticated } = useAuthStatus()
  const usePreview = mode === 'preview' && ownerHandle != null
  const previewResult = useQuery(api.comments.preview, usePreview ? { soulId } : 'skip')
  const paginatedResult = useQuery(
    api.comments.listPaginated,
    !usePreview ? { soulId, limit: 20 } : 'skip'
  )
  const [paginatedCursor, setPaginatedCursor] = useState<number | undefined>(undefined)
  const paginatedWithCursor = useQuery(
    api.comments.listPaginated,
    !usePreview && paginatedCursor != null ? { soulId, cursor: paginatedCursor, limit: 20 } : 'skip'
  )
  const [accumulatedItems, setAccumulatedItems] = useState<CommentItem[]>([])
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined)
  const addComment = useMutation(api.comments.add)
  const removeComment = useMutation(api.comments.remove)
  const createReport = useMutation(api.reports.create)

  const [newBody, setNewBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<Id<'comments'> | null>(null)
  const [reportReason, setReportReason] = useState<
    'spam' | 'harassment' | 'misinformation' | 'other'
  >('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<'comments'> | null>(null)

  // Resolve items and totalCount from preview or paginated
  const previewItems = (previewResult?.items ?? []) as CommentItem[]
  const previewTotal = previewResult?.totalCount ?? 0
  const firstPage = (paginatedResult?.items ?? []) as CommentItem[]
  const firstPageNext = paginatedResult?.nextCursor
  const firstPageTotal = paginatedResult?.totalCount ?? 0
  const morePage = (paginatedWithCursor?.items ?? []) as CommentItem[]

  const items: CommentItem[] = usePreview
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
      setNextCursor(firstPageNext)
    } else if (paginatedWithCursor != null) {
      setAccumulatedItems((prev) => [...prev, ...morePage])
      setNextCursor(paginatedWithCursor.nextCursor)
    }
  }, [usePreview, paginatedCursor, firstPage, firstPageNext, paginatedWithCursor, morePage])

  const tree = buildCommentTree(items)
  const hasMore = !usePreview && nextCursor != null

  const handleSubmitRoot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push(ROUTES.login as Route)
      return
    }
    const body = newBody.trim()
    if (!body) return
    setIsSubmitting(true)
    try {
      await addComment({ soulId, body })
      setNewBody('')
      toast.success('Comment added')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add comment'
      toast.error(msg)
      logger.error('Comment add failed', err, { soulSlug })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: Id<'comments'>) => {
    e.preventDefault()
    if (!isAuthenticated) return
    const body = replyBody.trim()
    if (!body) return
    setIsSubmitting(true)
    try {
      await addComment({ soulId, body, parentCommentId })
      setReplyingTo(null)
      setReplyBody('')
      toast.success('Reply added')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add reply'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: Id<'comments'>) => {
    try {
      await removeComment({ commentId })
      setConfirmDeleteId(null)
      toast.success('Comment removed')
    } catch (err) {
      toast.error('Failed to remove comment')
    }
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingCommentId) return
    setIsReporting(true)
    try {
      await createReport({
        commentId: reportingCommentId,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      })
      toast.success('Report submitted. Thank you.')
      setReportingCommentId(null)
      setReportDetails('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report'
      toast.error(msg)
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <section className="mb-12">
      <SectionHeader
        variant="label"
        title={totalCount === 0 ? 'Comments' : `Comments (${totalCount})`}
        spacing="large"
      />

      {isAuthenticated ? (
        <form onSubmit={handleSubmitRoot} className="mb-6">
          <textarea
            id="comment-body"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            maxLength={COMMENT_CHAR_LIMIT}
            aria-label="Add a comment"
            aria-describedby="comment-char-count"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text-muted resize-y"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              id="comment-char-count"
              className={
                newBody.length > 1800
                  ? 'text-xs text-amber-600 dark:text-amber-500'
                  : 'text-xs text-text-muted'
              }
              aria-live="polite"
              aria-atomic="true"
            >
              {newBody.length} / {COMMENT_CHAR_LIMIT}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!newBody.trim() || isSubmitting}
              aria-busy={isSubmitting}
              aria-disabled={!newBody.trim() || isSubmitting}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Post
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-text-muted mb-6">
          <Link href={ROUTES.login as Route} className="text-text-secondary hover:underline">
            Sign in
          </Link>{' '}
          to comment.
        </p>
      )}

      {reportingCommentId != null && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center border-0 bg-transparent p-4 backdrop:bg-black/50"
          aria-labelledby="report-dialog-title"
          onCancel={(e) => {
            e.preventDefault()
            setReportingCommentId(null)
            setReportDetails('')
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-lg">
            <h2 id="report-dialog-title" className="text-sm font-medium text-text mb-3">
              Report comment
            </h2>
            <form onSubmit={handleReportSubmit}>
              <fieldset className="mb-3">
                <legend className="sr-only">Reason</legend>
                <div className="flex flex-col gap-2">
                  {(['spam', 'harassment', 'misinformation', 'other'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="radio"
                        name="reportReason"
                        value={r}
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="rounded-full border-border"
                      />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="report-details" className="mb-2 block text-xs text-text-muted">
                Additional details (optional)
              </label>
              <textarea
                id="report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Any additional context…"
                rows={2}
                maxLength={500}
                className="mb-4 w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-muted resize-y"
                aria-describedby="report-details-hint"
              />
              <p id="report-details-hint" className="mt-1 text-xs text-text-muted font-mono">
                Optional, {reportDetails.length}/500
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReportingCommentId(null)
                    setReportDetails('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isReporting} aria-busy={isReporting}>
                  Submit report
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {usePreview && totalCount > items.length && ownerHandle && (
        <p className="mb-4 text-sm text-text-muted">
          <Link
            href={soulCommentsPath(ownerHandle, soulSlug)}
            className="text-text-secondary hover:underline"
          >
            View all {totalCount} comments
          </Link>
        </p>
      )}

      <div className="space-y-4">
        {tree.length === 0 ? (
          <p className="text-sm text-text-muted">No comments yet. Be the first.</p>
        ) : (
          tree.map((node) => (
            <CommentBlock
              key={node.comment._id}
              item={node}
              replies={node.replies}
              isAuthenticated={isAuthenticated}
              currentUserId={me?._id}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              isSubmitting={isSubmitting}
              onReplySubmit={handleSubmitReply}
              onDelete={handleDelete}
              onReport={setReportingCommentId}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
              soulId={soulId}
            />
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
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

function CommentBlock({
  item,
  replies,
  isAuthenticated,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyBody,
  setReplyBody,
  isSubmitting,
  onReplySubmit,
  onDelete,
  onReport,
  confirmDeleteId,
  setConfirmDeleteId,
  soulId,
}: {
  item: CommentItem
  replies: CommentItem[]
  isAuthenticated: boolean
  currentUserId?: Id<'users'>
  replyingTo: Id<'comments'> | null
  setReplyingTo: (id: Id<'comments'> | null) => void
  replyBody: string
  setReplyBody: (s: string) => void
  isSubmitting: boolean
  onReplySubmit: (e: React.FormEvent, parentId: Id<'comments'>) => void
  onDelete: (id: Id<'comments'>) => void
  onReport: (commentId: Id<'comments'>) => void
  confirmDeleteId: Id<'comments'> | null
  setConfirmDeleteId: (id: Id<'comments'> | null) => void
  soulId: Id<'souls'>
}) {
  const { comment, author } = item
  const isReplyOpen = replyingTo === comment._id
  const canDelete = currentUserId && author?._id === currentUserId
  const canReport = isAuthenticated && !canDelete
  const isConfirmingDelete = confirmDeleteId === comment._id

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <CommentAvatar author={author} size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text whitespace-pre-wrap">{comment.body}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  {author ? (
                    author.handle ? (
                      <Link
                        href={profilePath(author.handle) as Route}
                        className="text-text-secondary hover:underline"
                      >
                        {getUserDisplayName(author)}
                      </Link>
                    ) : (
                      <span>{getUserDisplayName(author)}</span>
                    )
                  ) : (
                    <span>Unknown</span>
                  )}
                  <span>{formatDistanceToNow(comment.createdAt)} ago</span>
                </div>
              </div>
              {canDelete &&
                (isConfirmingDelete ? (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="text-text-muted">Delete?</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-red-500 hover:text-red-600"
                      onClick={() => onDelete(comment._id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(comment._id)}
                    className="p-1 text-text-muted hover:text-red-500"
                    aria-label="Delete comment"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setReplyingTo(isReplyOpen ? null : comment._id)}
              className="text-xs text-text-muted hover:text-text"
            >
              Reply
            </button>
          )}
          {canReport && (
            <button
              type="button"
              onClick={() => onReport(comment._id)}
              className="text-xs text-text-muted hover:text-text"
              aria-label="Report comment"
              title="Report comment"
            >
              <Flag className="inline w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isReplyOpen && (
          <form
            onSubmit={(e) => onReplySubmit(e, comment._id)}
            className="mt-3 pl-2 border-l-2 border-border"
          >
            <textarea
              id={`reply-body-${comment._id}`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              maxLength={COMMENT_CHAR_LIMIT}
              aria-label="Write a reply"
              aria-describedby={`reply-char-count-${comment._id}`}
              className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-muted resize-y"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span
                id={`reply-char-count-${comment._id}`}
                className={
                  replyBody.length > 1800
                    ? 'text-xs text-amber-600 dark:text-amber-500'
                    : 'text-xs text-text-muted'
                }
                aria-live="polite"
                aria-atomic="true"
              >
                {replyBody.length} / {COMMENT_CHAR_LIMIT}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyBody('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyBody.trim() || isSubmitting}
                  aria-busy={isSubmitting}
                  aria-disabled={!replyBody.trim() || isSubmitting}
                >
                  <Send className="w-3 h-3" />
                  Reply
                </Button>
              </div>
            </div>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-border-subtle">
            {replies.map((r) => {
              const isReplyAuthor = currentUserId && r.author?._id === currentUserId
              const isReplyConfirmingDelete = confirmDeleteId === r.comment._id
              return (
                <div key={r.comment._id} className="flex items-start gap-2 text-sm">
                  <CommentAvatar author={r.author} size={24} />
                  <div className="min-w-0 flex-1">
                    <p className="text-text whitespace-pre-wrap">{r.comment.body}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      {r.author ? (
                        r.author.handle ? (
                          <Link
                            href={profilePath(r.author.handle) as Route}
                            className="text-text-secondary hover:underline"
                          >
                            {getUserDisplayName(r.author)}
                          </Link>
                        ) : (
                          <span>{getUserDisplayName(r.author)}</span>
                        )
                      ) : (
                        <span>Unknown</span>
                      )}
                      <span>{formatDistanceToNow(r.comment.createdAt)} ago</span>
                      {isReplyAuthor &&
                        (isReplyConfirmingDelete ? (
                          <>
                            <span className="text-text-muted">Delete?</span>
                            <button
                              type="button"
                              onClick={() => onDelete(r.comment._id)}
                              className="text-red-500 hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(r.comment._id)}
                            className="text-text-muted hover:text-red-500"
                            aria-label="Delete reply"
                            title="Delete reply"
                          >
                            <Trash2 className="inline w-3 h-3" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
