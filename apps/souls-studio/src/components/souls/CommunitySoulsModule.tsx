import { useVirtualizer } from '@tanstack/react-virtual'
import MarkdownPreview from '@uiw/react-markdown-preview'
import { useMutation, useQuery } from 'convex/react'
import {
  Check,
  ClipboardCopy,
  Download,
  Github,
  GripVertical,
  Loader2,
  PencilLine,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { toast } from 'sonner'
import { useCommunitySouls } from '../../hooks/useCommunitySouls'
import { useDebounce } from '../../hooks/useDebounce'
import { useInstalledSoulSlugs } from '../../hooks/useInstalledSoulSlugs'
import { useModalAccessibility } from '../../hooks/useModalAccessibility'
import { useSoulAuth } from '../../hooks/useSoulAuth'
import { getConfiguredConvexUrl } from '../../lib/convex-config'
import { toSoulDisplaySegment } from '../../lib/repo-display'
import { soulsApi } from '../../lib/souls-convex-api'
import { signInExternal } from '../../lib/tauri-auth'
import type { CommunitySoulSort } from '../../types/community'
import type { CommunitySoulDraft } from '../../types/community-draft'
import { ConfirmModal } from '../ConfirmModal'

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(timestamp: number) {
  if (!timestamp) {
    return 'Unknown'
  }

  return new Date(timestamp).toLocaleString()
}

function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return 'Unknown'
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 30) return new Date(timestamp).toLocaleDateString()
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function CommunitySoulsModule() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [sort, setSort] = useState<CommunitySoulSort>('popular')
  const [contentView, setContentView] = useState<'preview' | 'markdown'>('preview')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [starring, setStarring] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showForkConfirm, setShowForkConfirm] = useState(false)
  const installedSlugs = useInstalledSoulSlugs()
  const [starOverride, setStarOverride] = useState<boolean | null>(null)
  const convexConfigured = Boolean(getConfiguredConvexUrl())
  const { me, signIn } = useSoulAuth(convexConfigured)
  const toggleStar = useMutation(soulsApi.souls.toggleStar)
  const trackDownload = useMutation(soulsApi.souls.trackDownload)
  const {
    souls,
    loading,
    error,
    isTruncated,
    selectedSoul,
    selectedSoulId,
    selectedContent,
    contentLoading,
    contentError,
    setSelectedSoulId,
    patchSoul,
    refresh,
  } = useCommunitySouls({ enabled: true, sort })
  const starredFromServer = useQuery(
    soulsApi.souls.isStarred,
    me && selectedSoul?.remoteId ? ({ soulId: selectedSoul.remoteId as never } as never) : 'skip'
  ) as boolean | undefined
  const isStarred = starOverride ?? Boolean(starredFromServer)

  useEffect(() => {
    setStarOverride(null)
  }, [selectedSoul?.id, starredFromServer])

  useEffect(() => {
    setContentView('preview')
  }, [selectedSoul?.id])

  useEffect(() => {
    if (me && authModalOpen) {
      setAuthModalOpen(false)
      setAuthError(null)
    }
  }, [authModalOpen, me])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
    setAuthError(null)
  }, [])
  const { modalRef: authModalRef, handleKeyDown: authModalKeyDown } = useModalAccessibility(
    authModalOpen,
    closeAuthModal
  )

  const openAuthModal = () => {
    setAuthError(null)
    setAuthModalOpen(true)
  }

  const handleSignIn = async () => {
    setAuthError(null)
    setAuthLoading(true)
    try {
      await signInExternal(signIn, 'github')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleToggleStar = async () => {
    if (!selectedSoul || starring) {
      return
    }

    if (!me) {
      openAuthModal()
      return
    }

    if (!selectedSoul.remoteId) {
      setActionError('Soul details are still loading. Try again in a moment.')
      return
    }

    setActionError(null)
    setStarring(true)
    try {
      const result = (await toggleStar({ soulId: selectedSoul.remoteId as never })) as {
        starred?: boolean
      }
      const nextStarred = Boolean(result?.starred)
      setStarOverride(nextStarred)
      patchSoul(selectedSoul.id, (current) => ({
        ...current,
        stars: Math.max(0, current.stars + (nextStarred ? 1 : -1)),
      }))
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
    } finally {
      setStarring(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedSoul || !selectedContent || downloading) {
      return
    }

    setActionError(null)
    setDownloading(true)
    try {
      try {
        await trackDownload({
          handle: selectedSoul.ownerHandle,
          slug: selectedSoul.slug,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        } as never)

        patchSoul(selectedSoul.id, (current) => ({
          ...current,
          downloads: current.downloads + 1,
        }))
      } catch {
        // Download should still work even if telemetry/count update fails.
      }

      const fileNameBase = sanitizeFileName(selectedSoul.slug || selectedSoul.name) || 'soul'
      const blob = new Blob([selectedContent], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileNameBase}.md`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded "${selectedSoul.name}"`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) {
      return souls
    }

    return souls.filter((soul) => {
      const handleSlug = `${soul.ownerHandle}/${soul.slug}`.toLowerCase()
      return (
        soul.name.toLowerCase().includes(q) ||
        soul.tagline.toLowerCase().includes(q) ||
        soul.description.toLowerCase().includes(q) ||
        handleSlug.includes(q)
      )
    })
  }, [debouncedSearch, souls])

  const handleEditAndPublish = (draft: CommunitySoulDraft) => {
    // Deduplicate slug if it already exists in the user's collection
    // installedSlugs contains "ownerHandle/slug" entries, so extract just slugs
    const existingSlugs = new Set(
      Array.from(installedSlugs).map((entry) => entry.split('/').pop() ?? entry)
    )
    let slug = draft.slug.toLowerCase()
    if (existingSlugs.has(slug)) {
      let suffix = 2
      while (existingSlugs.has(`${slug}-${suffix}`)) {
        suffix++
      }
      slug = `${slug}-${suffix}`
    }

    window.dispatchEvent(
      new CustomEvent<CommunitySoulDraft>('souls-studio:open-in-my-souls', {
        detail: { ...draft, slug },
      })
    )
  }

  const handleForkFromContent = () => {
    if (!selectedSoul || !selectedContent) return
    handleEditAndPublish({
      name: selectedSoul.name,
      slug: selectedSoul.slug,
      tagline: selectedSoul.tagline,
      description: selectedSoul.description,
      content: selectedContent,
    })
  }

  const listParentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  return (
    <div className="h-full w-full min-h-0 bg-[var(--bg-primary)]">
      <Group orientation="horizontal" className="h-full">
        <Panel defaultSize="30%" minSize="20%" maxSize="50%">
          <div className="h-full border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
            <div className="sticky top-0 z-10 p-4 border-b border-[var(--border)] space-y-3 bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Browse Souls</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {souls.length} available{isTruncated && ' · sorting in background'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void refresh()}
                    className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                    title="Refresh soul list"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search all souls..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <label
                  htmlFor="community-sort"
                  className="text-xs text-[var(--text-muted)] font-medium"
                >
                  Sort by
                </label>
                <select
                  id="community-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CommunitySoulSort)}
                  className="native-select min-w-0 flex-1 basis-32 px-2.5 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="popular">Popular</option>
                  <option value="recent">Recently Updated</option>
                  <option value="trending">Trending</option>
                  <option value="stars">Most Starred</option>
                  <option value="published">Newest</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-2 space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-3 rounded-lg">
                    <div className="h-4 bg-[var(--bg-tertiary)] rounded w-2/3 mb-2" />
                    <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2 mb-2" />
                    <div className="h-3 bg-[var(--bg-tertiary)] rounded w-full mb-2" />
                    <div className="flex gap-3 mt-2">
                      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-10" />
                      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">{error}</div>
            ) : (
              <div ref={listParentRef} className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="p-3 text-sm text-[var(--text-muted)]">No souls found.</div>
                ) : (
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const soul = filtered[virtualItem.index]
                      return (
                        <button
                          key={soul.id}
                          ref={virtualizer.measureElement}
                          data-index={virtualItem.index}
                          onClick={() => setSelectedSoulId(soul.id)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                          className={`text-left p-3 rounded-lg border mb-1 transition-colors ${
                            selectedSoulId === soul.id
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                              : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {soul.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            @{toSoulDisplaySegment(soul.ownerHandle)}/{soul.slug}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {soul.tagline}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span
                              className="inline-flex items-center gap-1"
                              title={`${soul.downloads} downloads`}
                            >
                              <Download className="w-2.5 h-2.5" />
                              {soul.downloads} {soul.downloads === 1 ? 'download' : 'downloads'}
                            </span>
                            <span
                              className="inline-flex items-center gap-1"
                              title={`${soul.stars} stars`}
                            >
                              <Star className="w-2.5 h-2.5" />
                              {soul.stars} {soul.stars === 1 ? 'star' : 'stars'}
                            </span>
                            {installedSlugs.has(
                              `${soul.ownerHandle}/${soul.slug}`.toLowerCase()
                            ) && (
                              <span
                                className="inline-flex items-center gap-1 text-emerald-500 font-medium"
                                title="Installed in My Souls"
                              >
                                <Check className="w-2.5 h-2.5" />
                                Installed
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
        <Separator className="w-1.5 bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-col-resize flex items-center justify-center group">
          <GripVertical className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </Separator>
        <Panel defaultSize="70%" minSize="40%">
          <div className="h-full min-w-0 flex flex-col bg-[var(--bg-secondary)]">
            {!selectedSoul ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center px-8">
                  <p className="text-sm text-[var(--text-muted)]">
                    Select a soul to preview its content.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">
                    Browse the list to find souls for Claude, then fork to your collection.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-[var(--border)]">
                  {/* Title row: name + star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {selectedSoul.name}
                      </h2>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        @{toSoulDisplaySegment(selectedSoul.ownerHandle)}/{selectedSoul.slug}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleToggleStar()}
                      disabled={starring}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press ${
                        isStarred
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                          : 'border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                      }`}
                      title={
                        me ? (isStarred ? 'Remove star' : 'Star this soul') : 'Sign in to star'
                      }
                    >
                      {starring ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500' : ''}`} />
                      )}
                      <span className="font-semibold">{selectedSoul.stars}</span>
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    {selectedSoul.description || selectedSoul.tagline}
                  </p>

                  {/* Actions row: metadata + actions */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                    <span
                      className="text-xs text-[var(--text-muted)]"
                      title={formatDate(selectedSoul.updatedAt)}
                    >
                      Updated {formatRelativeDate(selectedSoul.updatedAt)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {selectedSoul.downloads}{' '}
                      {selectedSoul.downloads === 1 ? 'download' : 'downloads'}
                    </span>

                    <div className="ml-auto flex items-center gap-1.5">
                      {/* Utility actions: icon-only */}
                      <button
                        onClick={() => {
                          if (selectedContent) {
                            navigator.clipboard.writeText(selectedContent).then(() => {
                              toast.success('Copied to clipboard')
                            })
                          }
                        }}
                        disabled={!selectedContent}
                        className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-press"
                        title="Copy SOUL.md to clipboard"
                        aria-label="Copy soul content to clipboard"
                      >
                        <ClipboardCopy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => void handleDownload()}
                        disabled={downloading || !selectedContent}
                        className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-press"
                        title="Download as .md file"
                        aria-label={`Download ${selectedSoul.name}`}
                      >
                        {downloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Primary action */}
                      <button
                        onClick={() =>
                          handleEditAndPublish({
                            name: selectedSoul.name,
                            slug: selectedSoul.slug,
                            tagline: selectedSoul.tagline,
                            description: selectedSoul.description,
                            content: selectedContent ?? '',
                          })
                        }
                        disabled={!selectedContent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-press whitespace-nowrap"
                        title="Fork to My Souls for editing"
                        aria-label={`Fork ${selectedSoul.name} to My Souls`}
                      >
                        <PencilLine className="w-3 h-3" aria-hidden="true" />
                        <span>Fork to My Souls</span>
                      </button>
                    </div>
                  </div>
                  {actionError && <p className="mt-2 text-xs text-red-500">{actionError}</p>}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div
                    className="mb-4 segmented-control"
                    style={{ '--segment-count': '2', width: '180px' } as Record<string, string>}
                  >
                    <div
                      className="segmented-control-indicator"
                      style={{
                        transform: contentView === 'preview' ? 'translateX(0)' : 'translateX(100%)',
                      }}
                    />
                    <button
                      onClick={() => setContentView('preview')}
                      className={`segmented-control-item flex-1 text-center ${contentView === 'preview' ? 'active' : ''}`}
                      style={{ fontSize: '12px', padding: '4px 0' }}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setContentView('markdown')}
                      className={`segmented-control-item flex-1 text-center ${contentView === 'markdown' ? 'active' : ''}`}
                      style={{ fontSize: '12px', padding: '4px 0' }}
                    >
                      Markdown
                    </button>
                  </div>
                  {contentLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-6 bg-[var(--bg-tertiary)] rounded w-1/3" />
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-full" />
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-5/6" />
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-2/3" />
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-full mt-4" />
                      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-4/5" />
                    </div>
                  ) : contentError ? (
                    <p className="text-sm text-red-500">{contentError}</p>
                  ) : selectedContent && contentView === 'preview' ? (
                    <div>
                      <MarkdownPreview
                        source={selectedContent}
                        style={{ backgroundColor: 'transparent', pointerEvents: 'none' }}
                        wrapperElement={{ 'data-color-mode': 'dark' }}
                      />
                    </div>
                  ) : selectedContent && contentView === 'markdown' ? (
                    <pre
                      className="w-full overflow-auto p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] text-[13px] leading-6 text-[var(--text-primary)] font-mono whitespace-pre-wrap break-words cursor-pointer hover:border-[var(--accent)]/50 transition-colors"
                      onClick={() => setShowForkConfirm(true)}
                      title="Click to fork and edit this soul"
                    >
                      <code>{selectedContent}</code>
                    </pre>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">
                      No SOUL.md content available.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </Panel>
      </Group>

      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onKeyDown={authModalKeyDown}
        >
          <div
            ref={authModalRef}
            className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5 shadow-2xl animate-fade-in-scale"
          >
            <h3
              id="auth-modal-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              Sign in required
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Use GitHub login to star community souls.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={closeAuthModal}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSignIn()}
                disabled={authLoading}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Github className="w-4 h-4" />
                )}
                Continue
              </button>
            </div>
            {authError && <p className="mt-3 text-xs text-red-500">{authError}</p>}
          </div>
        </div>
      )}

      <ConfirmModal
        open={showForkConfirm}
        title="Fork this soul?"
        message={
          selectedSoul
            ? `Fork "${selectedSoul.name}" to your collection? You'll be able to edit and customize it.`
            : ''
        }
        confirmLabel="Fork & Edit"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowForkConfirm(false)
          handleForkFromContent()
        }}
        onCancel={() => setShowForkConfirm(false)}
      />
    </div>
  )
}
