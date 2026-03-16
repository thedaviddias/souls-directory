/**
 * Browse Content - Client Component
 *
 * Receives SSR data and handles interactive filtering.
 * URL state is managed via nuqs for client-side updates.
 * Uses TanStack Virtual for DOM virtualization + cursor-based infinite loading.
 */

'use client'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useConvex } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SearchInput } from '@/components/search/search-input'
import { CategoryBadge } from '@/components/shared/category-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { SoulCard } from '@/components/souls/soul-card'
import { useAnalytics } from '@/hooks/use-analytics'
import { api } from '@/lib/convex-api'
import { ROUTES } from '@/lib/routes'
import type { Category, Soul } from '@/types'

const PAGE_SIZE = 24
const ROW_HEIGHT_ESTIMATE = 220
const OVERSCAN = 3

const sortOptions = ['recent', 'published', 'popular', 'trending'] as const
type SortOption = (typeof sortOptions)[number]

const sortLabels: Record<SortOption, string> = {
  recent: 'Recently updated',
  published: 'Recently published',
  popular: 'Popular',
  trending: 'Trending',
}

function useColumns() {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 1280) setColumns(4)
      else if (w >= 1024) setColumns(3)
      else if (w >= 640) setColumns(2)
      else setColumns(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return columns
}

interface BrowseContentProps {
  initialCategories: Category[]
  initialSouls: Soul[]
  initialCursor: string | null
}

export function BrowseContent({
  initialCategories,
  initialSouls,
  initialCursor,
}: BrowseContentProps) {
  const analytics = useAnalytics()
  const convex = useConvex() as {
    // biome-ignore lint/suspicious/noExplicitAny: Convex client type is widened
    query: (ref: unknown, args: Record<string, unknown>) => Promise<any>
  }
  const columns = useColumns()

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsString,
      sort: parseAsStringLiteral(sortOptions).withDefault('recent'),
      featured: parseAsBoolean.withDefault(false),
    },
    {
      shallow: false,
    }
  )

  const query = filters.q
  const categorySlug = filters.category ?? undefined
  const sortBy = filters.sort as SortOption

  const [souls, setSouls] = useState<Soul[]>(initialSouls)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasMore = cursor !== null

  // Reset accumulated state when SSR data changes (filter navigation)
  useEffect(() => {
    setSouls(initialSouls)
    setCursor(initialCursor)
  }, [initialSouls, initialCursor])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const result = await convex.query(api.souls.list, {
        categorySlug,
        sort: sortBy,
        featured: filters.featured || undefined,
        limit: PAGE_SIZE,
        cursor,
      })
      if (result?.items) {
        const newSouls: Soul[] = result.items.map(
          // biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
          (item: { soul: Record<string, any>; category: Record<string, any> | null }) => ({
            id: item.soul._id,
            slug: item.soul.slug,
            ownerHandle: item.soul.ownerHandle ?? '',
            name: item.soul.name,
            tagline: item.soul.tagline || '',
            description: item.soul.description || '',
            content: '',
            downloads: item.soul.stats?.downloads || 0,
            stars: item.soul.stats?.stars || 0,
            upvotes: item.soul.stats?.upvotes || 0,
            featured: item.soul.featured || false,
            category_id: item.category?._id || '',
            category: item.category
              ? {
                  id: item.category._id,
                  slug: item.category.slug,
                  name: item.category.name,
                  description: item.category.description || '',
                  icon: item.category.icon || '',
                  color: item.category.color || '#878787',
                }
              : undefined,
            tags: [],
            created_at: new Date(item.soul.createdAt).toISOString(),
            updated_at: new Date(item.soul.updatedAt).toISOString(),
          })
        )
        setSouls((prev) => [...prev, ...newSouls])
        setCursor(result.nextCursor ?? null)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, convex, categorySlug, sortBy, filters.featured, cursor])

  // Client-side text search on accumulated souls
  const filteredSouls = useMemo(() => {
    if (!query) return souls

    const lowerQuery = query.toLowerCase()
    return souls.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.tagline.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery)
    )
  }, [souls, query])

  // Row-based virtualization: chunk souls into rows
  const rows = useMemo(() => {
    const result: Soul[][] = []
    for (let i = 0; i < filteredSouls.length; i += columns) {
      result.push(filteredSouls.slice(i, i + columns))
    }
    return result
  }, [filteredSouls, columns])

  const listRef = useRef<HTMLDivElement>(null)

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: OVERSCAN,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  })

  const virtualRows = virtualizer.getVirtualItems()

  // Trigger loadMore when the last virtual row is near visible
  useEffect(() => {
    if (!hasMore || isLoadingMore || virtualRows.length === 0) return
    const lastVirtualRow = virtualRows[virtualRows.length - 1]
    if (lastVirtualRow && lastVirtualRow.index >= rows.length - 2) {
      loadMore()
    }
  }, [virtualRows, rows.length, hasMore, isLoadingMore, loadMore])

  return (
    <main className="min-h-screen">
      <PageContainer>
        <Breadcrumb items={[{ name: 'Souls' }]} className="mb-6" />

        <div className="mb-8">
          <h1 className="text-lg font-medium text-text">Browse Souls</h1>
        </div>

        <div className="mb-8">
          <SearchInput defaultValue={query} placeholder="Search souls..." />
        </div>

        <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilters({ category: null })}
              className={`
                px-3 py-1.5 rounded-md text-sm transition-colors border
                ${
                  !categorySlug
                    ? 'bg-surface border-text-secondary text-text'
                    : 'border-border text-text-secondary hover:text-text hover:border-text-muted'
                }
              `}
            >
              All
            </button>
            {initialCategories.map((cat) => (
              <CategoryBadge
                key={cat.id}
                category={cat}
                size="md"
                onClick={() => {
                  analytics.track('filter_category', { category: cat.slug })
                  setFilters({ category: cat.slug })
                }}
                selected={categorySlug === cat.slug}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted font-mono">Sort:</span>
            {sortOptions.map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setFilters({ sort })}
                className={`
                  px-2 py-1 rounded-md text-xs transition-colors
                  ${
                    sortBy === sort
                      ? 'bg-elevated text-text'
                      : 'text-text-secondary hover:text-text'
                  }
                `}
              >
                {sortLabels[sort]}
              </button>
            ))}
          </div>
        </div>

        {filteredSouls.length === 0 && !isLoadingMore ? (
          <EmptyState
            title="No souls found"
            description="Try a different search or filter"
            action={{ label: 'Browse All', href: ROUTES.souls }}
          />
        ) : (
          <div ref={listRef}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                      {row?.map((soul) => (
                        <SoulCard key={soul.id} soul={soul} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        )}

        <div className="mt-8 text-center text-xs text-text-muted font-mono">
          {filteredSouls.length} soul{filteredSouls.length !== 1 ? 's' : ''} found
          {hasMore && !query && ' (scroll for more)'}
        </div>
      </PageContainer>
    </main>
  )
}
