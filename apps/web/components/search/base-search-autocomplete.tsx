'use client'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/convex-api'
import { soulPathFrom } from '@/lib/routes'
import { useQuery } from 'convex/react'
import { Search, X } from 'lucide-react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

const RECENT_SEARCHES_KEY = 'souls-recent-searches'
const MAX_RECENT_SEARCHES = 5

interface NavigationItem {
  key: string
  type: 'soul' | 'category' | 'recent' | 'view-all'
  slug?: string
  ownerHandle?: string
  name: string
  tagline?: string
  icon?: string
}

interface SearchState {
  query: string
  debouncedQuery: string
  isOpen: boolean
  highlightedKey: string | null
  recentSearches: string[]
}

type SearchAction =
  | { type: 'setQuery'; query: string }
  | { type: 'setDebouncedQuery'; query: string }
  | { type: 'setOpen'; isOpen: boolean }
  | { type: 'setHighlightedKey'; key: string | null }
  | { type: 'setRecentSearches'; searches: string[] }
  | { type: 'resetAfterNavigate' }

const initialState: SearchState = {
  query: '',
  debouncedQuery: '',
  isOpen: false,
  highlightedKey: null,
  recentSearches: [],
}

function reducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'setQuery':
      return {
        ...state,
        query: action.query,
        isOpen: true,
        highlightedKey: null,
      }
    case 'setDebouncedQuery':
      return {
        ...state,
        debouncedQuery: action.query,
      }
    case 'setOpen':
      return {
        ...state,
        isOpen: action.isOpen,
        highlightedKey: action.isOpen ? state.highlightedKey : null,
      }
    case 'setHighlightedKey':
      return {
        ...state,
        highlightedKey: action.key,
      }
    case 'setRecentSearches':
      return {
        ...state,
        recentSearches: action.searches,
      }
    case 'resetAfterNavigate':
      return {
        ...state,
        query: '',
        debouncedQuery: '',
        isOpen: false,
        highlightedKey: null,
      }
    default:
      return state
  }
}

interface BaseSearchAutocompleteProps {
  compact?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
  onNavigate?: () => void
  categoryPath: (slug: string) => Route
  searchPath: (query: string) => Route
}

export function BaseSearchAutocomplete({
  compact = false,
  placeholder = 'Search souls...',
  autoFocus = false,
  className = '',
  onNavigate,
  categoryPath,
  searchPath,
}: BaseSearchAutocompleteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [{ query, debouncedQuery, isOpen, highlightedKey, recentSearches }, dispatch] = useReducer(
    reducer,
    initialState
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'setDebouncedQuery', query })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        dispatch({
          type: 'setRecentSearches',
          searches: JSON.parse(stored),
        })
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const saveRecentSearch = useCallback(
    (search: string) => {
      const trimmed = search.trim()
      if (!trimmed) return

      const filtered = recentSearches.filter((item) => item !== trimmed)
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      dispatch({ type: 'setRecentSearches', searches: updated })
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
    },
    [recentSearches]
  )

  const clearRecentSearches = useCallback(() => {
    dispatch({ type: 'setRecentSearches', searches: [] })
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const results = useQuery(
    api.search.searchAutocomplete,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : 'skip'
  )

  const navigationItems = useMemo<NavigationItem[]>(() => {
    const items: NavigationItem[] = []

    if (!debouncedQuery && recentSearches.length > 0) {
      for (const search of recentSearches) {
        items.push({ key: `recent:${search}`, type: 'recent', name: search })
      }
      return items
    }

    if (results?.souls) {
      for (const soul of results.souls) {
        const ownerHandle = soul.ownerHandle ?? ''
        items.push({
          key: `soul:${ownerHandle}/${soul.slug}`,
          type: 'soul',
          slug: soul.slug,
          ownerHandle,
          name: soul.name,
          tagline: soul.tagline,
        })
      }
    }

    if (results?.categories) {
      for (const category of results.categories) {
        items.push({
          key: `category:${category.slug}`,
          type: 'category',
          slug: category.slug,
          name: category.name,
          icon: category.icon,
        })
      }
    }

    if (debouncedQuery && (results?.souls?.length || 0) > 0) {
      items.push({
        key: `view-all:${debouncedQuery}`,
        type: 'view-all',
        name: 'View all results',
      })
    }

    return items
  }, [debouncedQuery, results, recentSearches])

  const selectedIndex = navigationItems.findIndex((item) => item.key === highlightedKey)

  const resetAfterNavigate = useCallback(() => {
    dispatch({ type: 'resetAfterNavigate' })
    onNavigate?.()
  }, [onNavigate])

  const handleSelect = useCallback(
    (item: NavigationItem) => {
      if (item.type === 'soul' && item.slug) {
        saveRecentSearch(query)
        router.push(soulPathFrom({ ownerHandle: item.ownerHandle ?? '', slug: item.slug }))
        resetAfterNavigate()
      } else if (item.type === 'category' && item.slug) {
        router.push(categoryPath(item.slug))
        resetAfterNavigate()
      } else if (item.type === 'recent') {
        dispatch({ type: 'setQuery', query: item.name })
        dispatch({ type: 'setDebouncedQuery', query: item.name })
      } else if (item.type === 'view-all') {
        saveRecentSearch(query)
        router.push(searchPath(query))
        resetAfterNavigate()
      }
    },
    [categoryPath, query, resetAfterNavigate, router, saveRecentSearch, searchPath]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen && event.key !== 'Escape') {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          dispatch({ type: 'setOpen', isOpen: true })
          return
        }
      }

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          const nextIndex = selectedIndex < navigationItems.length - 1 ? selectedIndex + 1 : 0
          dispatch({
            type: 'setHighlightedKey',
            key: navigationItems[nextIndex]?.key ?? null,
          })
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          const nextIndex = selectedIndex > 0 ? selectedIndex - 1 : navigationItems.length - 1
          dispatch({
            type: 'setHighlightedKey',
            key: navigationItems[nextIndex]?.key ?? null,
          })
          break
        }
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && navigationItems[selectedIndex]) {
            handleSelect(navigationItems[selectedIndex])
          } else if (query.trim()) {
            saveRecentSearch(query)
            router.push(searchPath(query))
            resetAfterNavigate()
          }
          break
        case 'Escape':
          dispatch({ type: 'setOpen', isOpen: false })
          inputRef.current?.blur()
          break
      }
    },
    [
      handleSelect,
      isOpen,
      navigationItems,
      query,
      resetAfterNavigate,
      router,
      saveRecentSearch,
      searchPath,
      selectedIndex,
    ]
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        dispatch({ type: 'setOpen', isOpen: false })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = isOpen && (navigationItems.length > 0 || (debouncedQuery && !results))

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary ${
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => dispatch({ type: 'setQuery', query: event.target.value })}
          onFocus={() => dispatch({ type: 'setOpen', isOpen: true })}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full rounded-md border border-border bg-bg text-text placeholder-text-muted
            transition-colors focus:border-text-secondary focus:outline-none
            ${compact ? 'h-8 pl-8 pr-3 text-sm' : 'h-10 pl-10 pr-4 text-sm'}
          `}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              dispatch({ type: 'setQuery', query: '' })
              dispatch({ type: 'setDebouncedQuery', query: '' })
              inputRef.current?.focus()
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text ${
              compact ? 'min-w-0 h-3.5 w-3.5' : 'min-w-0 h-4 w-4'
            }`}
            aria-label="Clear search"
          >
            <X className="h-full w-full" />
          </Button>
        )}
      </div>

      {showDropdown && (
        <AutocompleteDropdown
          debouncedQuery={debouncedQuery}
          navigationItems={navigationItems}
          query={query}
          recentSearches={recentSearches}
          results={results}
          selectedKey={highlightedKey}
          onClearRecentSearches={clearRecentSearches}
          onHighlight={(key) => dispatch({ type: 'setHighlightedKey', key })}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

function AutocompleteDropdown({
  debouncedQuery,
  navigationItems,
  query,
  recentSearches,
  results,
  selectedKey,
  onClearRecentSearches,
  onHighlight,
  onSelect,
}: {
  debouncedQuery: string
  navigationItems: NavigationItem[]
  query: string
  recentSearches: string[]
  results:
    | {
        souls: Array<{ slug: string; ownerHandle?: string | null; name: string; tagline: string }>
        categories: Array<{ slug: string; name: string; icon: string }>
      }
    | undefined
  selectedKey: string | null
  onClearRecentSearches: () => void
  onHighlight: (key: string | null) => void
  onSelect: (item: NavigationItem) => void
}) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      {debouncedQuery && debouncedQuery.length >= 2 && !results && (
        <div className="px-4 py-3 text-xs text-text-secondary">Searching...</div>
      )}

      {!debouncedQuery && recentSearches.length > 0 && (
        <>
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
              Recent
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto py-0 text-xs"
              onClick={onClearRecentSearches}
            >
              Clear
            </Button>
          </div>
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item)}
              onMouseEnter={() => onHighlight(item.key)}
              className={`
                flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors
                ${selectedKey === item.key ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
              `}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </>
      )}

      {debouncedQuery && results && (
        <>
          {results.souls.length > 0 && (
            <>
              <div className="border-b border-border px-3 py-2">
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Souls
                </span>
              </div>
              {navigationItems
                .filter((item) => item.type === 'soul')
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onHighlight(item.key)}
                    className={`
                      w-full px-4 py-2.5 text-left transition-colors
                      ${selectedKey === item.key ? 'bg-elevated' : 'hover:bg-elevated/50'}
                    `}
                  >
                    <div className="truncate text-sm font-medium text-text">{item.name}</div>
                    {item.tagline && (
                      <div className="mt-0.5 truncate text-xs text-text-secondary">
                        {item.tagline}
                      </div>
                    )}
                  </button>
                ))}
            </>
          )}

          {results.categories.length > 0 && (
            <>
              <div className="border-b border-border px-3 py-2">
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Categories
                </span>
              </div>
              {navigationItems
                .filter((item) => item.type === 'category')
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onHighlight(item.key)}
                    className={`
                      flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors
                      ${selectedKey === item.key ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
                    `}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>Browse {item.name}</span>
                  </button>
                ))}
            </>
          )}

          {navigationItems.some((item) => item.type === 'view-all') && (
            <>
              <div className="border-t border-border" />
              {navigationItems
                .filter((item) => item.type === 'view-all')
                .map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onHighlight(item.key)}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors
                      ${selectedKey === item.key ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
                    `}
                  >
                    View all results for "{query}"
                  </button>
                ))}
            </>
          )}

          {results.souls.length === 0 && results.categories.length === 0 && (
            <div className="px-4 py-3 text-sm text-text-secondary">
              No results found for "{query}"
            </div>
          )}
        </>
      )}
    </div>
  )
}
