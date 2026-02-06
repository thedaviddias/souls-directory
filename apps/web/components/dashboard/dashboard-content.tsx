'use client'

import { useCollectionsEnabled } from '@/components/flags-provider'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SectionHeader } from '@/components/marketing/section-header'
import { FeaturedBadge } from '@/components/shared/featured-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Id } from '@/convex/_generated/dataModel'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { ROUTES, soulPath } from '@/lib/routes'
import { useMutation, useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUp,
  Download,
  Eye,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SoulItem {
  soul: {
    _id: string
    slug: string
    ownerHandle?: string | null
    name: string
    tagline: string
    stats?: { downloads: number; stars: number; upvotes?: number }
    featured?: boolean
    createdAt: number
    updatedAt: number
  }
  category: { name: string; color: string } | null
}

export function DashboardContent() {
  const router = useRouter()
  const { me, isAuthenticated, isLoading: authLoading } = useAuthStatus()
  const mySouls = useQuery(api.users.getMySouls, isAuthenticated ? {} : 'skip')
  const myStarredSouls = useQuery(
    api.users.getMyStarredSouls,
    isAuthenticated ? { limit: 5 } : 'skip'
  )
  const collectionsEnabled = useCollectionsEnabled()
  const myCollections = useQuery(
    api.collections.listMine,
    isAuthenticated && collectionsEnabled ? {} : 'skip'
  )
  const deleteSoul = useMutation(api.soulActions.deleteSoul)
  const createCollection = useMutation(api.collections.create)

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [soulToDelete, setSoulToDelete] = useState<{ id: Id<'souls'>; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for create collection dialog (only relevant when collectionsEnabled)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionPublic, setNewCollectionPublic] = useState(true)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(ROUTES.login)
    }
  }, [authLoading, isAuthenticated, router])

  const handleDeleteClick = (soulId: Id<'souls'>, soulName: string) => {
    setSoulToDelete({ id: soulId, name: soulName })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!soulToDelete) return

    setIsDeleting(true)
    try {
      await deleteSoul({ soulId: soulToDelete.id })
      setDeleteDialogOpen(false)
      setSoulToDelete(null)
    } catch (error) {
      logger.error('Failed to delete soul', error, { soulId: soulToDelete.id })
      toast.error('Failed to delete soul')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setSoulToDelete(null)
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCollectionName.trim()
    if (!name) {
      toast.error('Enter a name')
      return
    }
    setIsCreatingCollection(true)
    try {
      const { slug } = await createCollection({
        name,
        description: newCollectionDescription.trim() || undefined,
        isPublic: newCollectionPublic,
      })
      setCreateCollectionOpen(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
      toast.success('Collection created')
      router.push(ROUTES.collectionDetail(slug))
    } catch (error) {
      logger.error('Failed to create collection', error)
      toast.error('Failed to create collection')
    } finally {
      setIsCreatingCollection(false)
    }
  }

  // Show loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
      </div>
    )
  }

  const isLoadingSouls = mySouls === undefined

  return (
    <div id="main-content" className="flex-1">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'Dashboard' }]} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-medium text-text">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">
              Welcome back, {me?.displayName || me?.handle || 'friend'}
            </p>
          </div>
          <Button asChild variant="primary" size="sm">
            <Link href={ROUTES.upload}>
              <Plus className="w-4 h-4" />
              Submit Soul
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard
            label="My Souls"
            value={isLoadingSouls ? '-' : (mySouls?.length ?? 0).toString()}
            icon={<Eye className="w-4 h-4" />}
          />
          <StatCard
            label="Total Downloads"
            value={
              isLoadingSouls
                ? '-'
                : (
                    (mySouls as SoulItem[] | undefined)?.reduce(
                      (sum: number, s: SoulItem) => sum + (s.soul.stats?.downloads ?? 0),
                      0
                    ) ?? 0
                  ).toString()
            }
            icon={<Download className="w-4 h-4" />}
          />
          <StatCard
            label="Total Stars"
            value={
              isLoadingSouls
                ? '-'
                : (
                    (mySouls as SoulItem[] | undefined)?.reduce(
                      (sum: number, s: SoulItem) => sum + (s.soul.stats?.stars ?? 0),
                      0
                    ) ?? 0
                  ).toString()
            }
            icon={<Star className="w-4 h-4" />}
          />
          <StatCard
            label="Starred Souls"
            value={myStarredSouls === undefined ? '-' : (myStarredSouls?.length ?? 0).toString()}
            icon={<Star className="w-4 h-4 fill-current" />}
          />
        </div>

        {/* My Collections Section - gated by collections-enabled flag */}
        {collectionsEnabled && (
          <section className="mb-12">
            <div className="flex items-center justify-between gap-4 mb-4">
              <SectionHeader variant="label" title="My Collections" />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCreateCollectionOpen(true)}
                aria-label="Create collection"
              >
                <FolderPlus className="w-4 h-4" />
                New collection
              </Button>
            </div>
            {myCollections && myCollections.length > 0 ? (
              <div className="grid gap-3">
                {myCollections.map(
                  (col: {
                    _id: Id<'collections'>
                    slug: string
                    name: string
                    description?: string
                    soulCount: number
                    isPublic: boolean
                  }) => (
                    <Link
                      key={col._id}
                      href={ROUTES.collectionDetail(col.slug)}
                      className="block p-4 bg-surface border border-border rounded-lg hover:border-text-muted transition-colors"
                    >
                      <h3 className="text-sm font-medium text-text">{col.name}</h3>
                      {col.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                          {col.description}
                        </p>
                      )}
                      <p className="text-xs text-text-muted font-mono mt-2">
                        {col.soulCount} soul{col.soulCount !== 1 ? 's' : ''}
                        {col.isPublic ? ' · Public' : ' · Private'}
                      </p>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No collections yet. Create one to group souls you like.
              </p>
            )}
          </section>
        )}

        {/* My Souls Section */}
        <section className="mb-12">
          <SectionHeader variant="label" title="My Souls" />

          <div className="mt-4">
            {isLoadingSouls ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
              </div>
            ) : mySouls && mySouls.length > 0 ? (
              <div className="grid gap-3">
                {(mySouls as SoulItem[]).map(({ soul, category }: SoulItem) => (
                  <SoulRow
                    key={soul._id}
                    soul={soul}
                    category={category}
                    onDeleteClick={handleDeleteClick}
                    isOwned
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>

        {/* Starred Souls Section */}
        {myStarredSouls && myStarredSouls.length > 0 && (
          <section>
            <SectionHeader variant="label" title="Starred Souls" />
            <div className="grid gap-3 mt-4">
              {(myStarredSouls as SoulItem[]).map(({ soul, category }: SoulItem) => (
                <SoulRow key={soul._id} soul={soul} category={category} />
              ))}
            </div>
          </section>
        )}
      </PageContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="text-text">Delete Soul</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Are you sure you want to delete{' '}
              <span className="font-medium text-text">{soulToDelete?.name}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={isDeleting}
              loadingText="Deleting..."
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog - gated by collections-enabled flag */}
      {collectionsEnabled && (
        <Dialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen}>
          <DialogContent className="bg-surface border-border">
            <form onSubmit={handleCreateCollection}>
              <DialogHeader>
                <DialogTitle className="text-text">New collection</DialogTitle>
                <DialogDescription className="text-text-secondary">
                  Create a collection to group souls. You can add souls from their detail pages.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="collection-name" className="text-sm font-medium text-text">
                    Name
                  </label>
                  <input
                    id="collection-name"
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g. Developer souls"
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text-muted"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="collection-desc" className="text-sm font-medium text-text">
                    Description (optional)
                  </label>
                  <textarea
                    id="collection-desc"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Short description"
                    maxLength={300}
                    rows={2}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-text-muted resize-y"
                    aria-describedby="collection-desc-counter"
                  />
                  <p
                    id="collection-desc-counter"
                    className="text-xs text-text-muted font-mono"
                    aria-live="polite"
                  >
                    {newCollectionDescription.length}/300
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCollectionPublic}
                    onChange={(e) => setNewCollectionPublic(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-secondary">
                    Public (visible on Collections page)
                  </span>
                </label>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreateCollectionOpen(false)}
                  disabled={isCreatingCollection}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isCreatingCollection} loadingText="Creating...">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-mono text-text">{value}</p>
    </div>
  )
}

function SoulRow({
  soul,
  category,
  onDeleteClick,
  isOwned = false,
}: {
  soul: SoulItem['soul']
  category: SoulItem['category']
  onDeleteClick?: (soulId: Id<'souls'>, soulName: string) => void
  isOwned?: boolean
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeleteClick?.(soul._id as Id<'souls'>, soul.name)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="group relative bg-surface border border-border rounded-lg hover:border-text-muted transition-colors">
      <Link
        href={soulPath(soul.ownerHandle ?? '', soul.slug)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-text truncate">{soul.name}</h3>
            {soul.featured && <FeaturedBadge />}
          </div>
          <p className="text-xs text-text-secondary truncate">{soul.tagline}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted font-mono">
            {category && <span>{category.name}</span>}
            <span>Updated {formatDistanceToNow(soul.updatedAt)} ago</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted font-mono pr-20 sm:pr-24">
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {soul.stats?.downloads ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {soul.stats?.stars ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3.5 h-3.5" />
            {soul.stats?.upvotes ?? 0}
          </span>
        </div>
      </Link>

      {/* Action buttons - positioned inside the card */}
      {isOwned && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <Link
            href={ROUTES.uploadEdit(soul.ownerHandle ?? '', soul.slug)}
            onClick={handleEditClick}
            className="p-2 text-text-muted hover:text-text hover:bg-elevated rounded-md transition-colors"
            aria-label={`Edit ${soul.name}`}
            title="Edit soul"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          {onDeleteClick && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-text-muted hover:text-red-500 hover:bg-red-500/10"
              onClick={handleDelete}
              aria-label={`Delete ${soul.name}`}
              title="Delete soul"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-surface border border-border rounded-lg">
      <h3 className="text-sm font-medium text-text mb-2">No souls yet</h3>
      <p className="text-xs text-text-secondary mb-6 max-w-md mx-auto">
        You haven&apos;t created any souls yet. Share your first AI personality template with the
        community!
      </p>
      <Button asChild variant="primary" size="sm">
        <Link href={ROUTES.upload}>
          <Plus className="w-4 h-4" />
          Submit Your First Soul
        </Link>
      </Button>
    </div>
  )
}
