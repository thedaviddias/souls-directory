/**
 * Browse Content - Client Component
 *
 * Receives SSR data and handles interactive filtering.
 * URL state is managed via nuqs for client-side updates.
 */

'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SearchInput } from '@/components/search/search-input'
import { CategoryBadge } from '@/components/shared/category-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { SoulCard } from '@/components/souls/soul-card'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'
import { useAnalytics } from '@/hooks/use-analytics'
import { ROUTES } from '@/lib/routes'
import type { Category, Soul } from '@/types'
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { useMemo } from 'react'

// Sort options - default to recent
const sortOptions = ['recent', 'published', 'popular', 'trending', 'hot'] as const
type SortOption = (typeof sortOptions)[number]

// Display labels for sort options
const sortLabels: Record<SortOption, string> = {
  recent: 'Recently updated',
  published: 'Recently published',
  popular: 'Popular',
  trending: 'Trending',
  hot: 'Hot',
}

// "Tested with" filter — 2025 current models only (Open Router rankings + OpenAI)
const modelFilterOptions: { value: string; label: string }[] = [
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'kimi-k2.5', label: 'Kimi K2.5' },
  { value: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'claude-opus-4.5', label: 'Claude Opus 4.5' },
  { value: 'minimax-m2.1', label: 'MiniMax M2.1' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'grok-4.1', label: 'Grok 4.1' },
  { value: 'gpt-5.2', label: 'GPT-5.2' },
  { value: 'gpt-5', label: 'GPT-5' },
  { value: 'gpt-5-mini', label: 'GPT-5 mini' },
]

interface BrowseContentProps {
  initialCategories: Category[]
  initialSouls: Soul[]
}

export function BrowseContent({ initialCategories, initialSouls }: BrowseContentProps) {
  const analytics = useAnalytics()

  // Use nuqs for URL state (navigation triggers server re-fetch via Next.js)
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsString,
      model: parseAsString,
      sort: parseAsStringLiteral(sortOptions).withDefault('recent'),
      featured: parseAsBoolean.withDefault(false),
    },
    {
      shallow: false, // Important: triggers server re-fetch
    }
  )

  const query = filters.q
  const categorySlug = filters.category ?? undefined
  const modelSlug = filters.model ?? undefined
  const sortBy = filters.sort as SortOption

  // Client-side search filter for instant feedback
  // (Server already filtered by category/sort, this adds text search)
  const filteredSouls = useMemo(() => {
    if (!query) return initialSouls

    const lowerQuery = query.toLowerCase()
    return initialSouls.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.tagline.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery)
    )
  }, [initialSouls, query])

  return (
    <main className="min-h-screen">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'Souls' }]} className="mb-6" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-medium text-text">Browse Souls</h1>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchInput defaultValue={query} placeholder="Search souls..." />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border">
          {/* Categories */}
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

          {/* Model filter - tested with */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Tested with:</span>
            <button
              type="button"
              onClick={() => setFilters({ model: null })}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
                !modelSlug
                  ? 'bg-surface border-text-secondary text-text'
                  : 'border-border text-text-secondary hover:text-text hover:border-text-muted'
              }`}
            >
              Any
            </button>
            {modelFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilters({ model: opt.value })}
                className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors border ${
                  modelSlug === opt.value
                    ? 'bg-surface border-text-secondary text-text'
                    : 'border-border text-text-secondary hover:text-text hover:border-text-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort */}
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

        {/* Results */}
        {filteredSouls.length === 0 ? (
          <EmptyState
            title="No souls found"
            description="Try a different search or filter"
            action={{ label: 'Browse All', href: ROUTES.souls }}
          />
        ) : (
          <SoulCardGrid>
            {filteredSouls.map((soul) => (
              <SoulCard key={soul.id} soul={soul} />
            ))}
          </SoulCardGrid>
        )}

        {/* Count */}
        <div className="mt-8 text-center text-xs text-text-muted font-mono">
          {filteredSouls.length} soul{filteredSouls.length !== 1 ? 's' : ''} found
        </div>
      </PageContainer>
    </main>
  )
}
