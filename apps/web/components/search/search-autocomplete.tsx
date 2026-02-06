'use client'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/convex-api'
import { ROUTES, soulPathFrom, soulsByCategoryPath, soulsSearchPath } from '@/lib/routes'
import { useQuery } from 'convex/react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const RECENT_SEARCHES_KEY = 'souls-recent-searches'
const MAX_RECENT_SEARCHES = 5

interface SearchAutocompleteProps {
  /**
   * Compact mode for header (smaller input, minimal styling)
   */
  compact?: boolean
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Auto-focus the input on mount
   */
  autoFocus?: boolean
  /**
   * Class name for the container
   */
  className?: string
  /**
   * Callback when user navigates to a result
   */
  onNavigate?: () => void
}

/**
 * Search autocomplete component with debounced results, keyboard navigation,
 * and recent search history.
 */
export function SearchAutocomplete({
  compact = false,
  placeholder = 'Search souls...',
  autoFocus = false,
  className = '',
  onNavigate,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Handle auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Save recent search
  const saveRecentSearch = useCallback((search: string) => {
    const trimmed = search.trim()
    if (!trimmed) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed)
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
      return updated
    })
  }, [])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Fetch autocomplete results
  const results = useQuery(
    api.search.searchAutocomplete,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : 'skip'
  )

  // Build the list of items for keyboard navigation
  const navigationItems = useMemo(() => {
    const items: Array<{
      type: 'soul' | 'category' | 'recent' | 'view-all'
      slug?: string
      ownerHandle?: string
      name: string
      tagline?: string
      icon?: string
    }> = []

    // If no query, show recent searches
    if (!debouncedQuery && recentSearches.length > 0) {
      for (const search of recentSearches) {
        items.push({ type: 'recent', name: search })
      }
      return items
    }

    // Souls
    if (results?.souls) {
      for (const soul of results.souls) {
        items.push({
          type: 'soul',
          slug: soul.slug,
          ownerHandle: soul.ownerHandle ?? '',
          name: soul.name,
          tagline: soul.tagline,
        })
      }
    }

    // Categories
    if (results?.categories) {
      for (const cat of results.categories) {
        items.push({
          type: 'category',
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
        })
      }
    }

    // View all results
    if (debouncedQuery && (results?.souls?.length || 0) > 0) {
      items.push({ type: 'view-all', name: 'View all results' })
    }

    return items
  }, [debouncedQuery, results, recentSearches])

  // Handle item selection
  const handleSelect = useCallback(
    (item: (typeof navigationItems)[number]) => {
      if (item.type === 'soul' && item.slug) {
        saveRecentSearch(query)
        router.push(soulPathFrom({ ownerHandle: item.ownerHandle ?? '', slug: item.slug }))
        setIsOpen(false)
        setQuery('')
        onNavigate?.()
      } else if (item.type === 'category' && item.slug) {
        router.push(soulsByCategoryPath(item.slug))
        setIsOpen(false)
        setQuery('')
        onNavigate?.()
      } else if (item.type === 'recent') {
        setQuery(item.name)
        setDebouncedQuery(item.name)
      } else if (item.type === 'view-all') {
        saveRecentSearch(query)
        router.push(soulsSearchPath(query))
        setIsOpen(false)
        setQuery('')
        onNavigate?.()
      }
    },
    [query, router, saveRecentSearch, onNavigate]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen && e.key !== 'Escape') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          setIsOpen(true)
          return
        }
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < navigationItems.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : navigationItems.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && navigationItems[selectedIndex]) {
            handleSelect(navigationItems[selectedIndex])
          } else if (query.trim()) {
            saveRecentSearch(query)
            router.push(soulsSearchPath(query))
            setIsOpen(false)
            setQuery('')
            onNavigate?.()
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [
      isOpen,
      navigationItems,
      selectedIndex,
      handleSelect,
      query,
      router,
      saveRecentSearch,
      onNavigate,
    ]
  )

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset selection when query or results change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [debouncedQuery, results])

  const showDropdown = isOpen && (navigationItems.length > 0 || (debouncedQuery && !results))

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-text-muted ${
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full bg-bg border border-border rounded-md text-text placeholder-text-muted
            focus:outline-none focus:border-text-secondary transition-colors
            ${compact ? 'h-8 pl-8 pr-3 text-sm' : 'h-10 pl-10 pr-4 text-sm'}
          `}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text ${
              compact ? 'w-3.5 h-3.5 min-w-0' : 'w-4 h-4 min-w-0'
            }`}
            aria-label="Clear search"
          >
            <X className="w-full h-full" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {/* Loading state */}
          {debouncedQuery && debouncedQuery.length >= 2 && !results && (
            <div className="px-4 py-3 text-xs text-text-muted">Searching...</div>
          )}

          {/* Recent searches */}
          {!debouncedQuery && recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
                  Recent
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-0"
                  onClick={clearRecentSearches}
                >
                  Clear
                </Button>
              </div>
              {navigationItems.map((item, index) => (
                <button
                  key={`recent-${item.name}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors
                    ${selectedIndex === index ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
                  `}
                >
                  <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </>
          )}

          {/* Results */}
          {debouncedQuery && results && (
            <>
              {/* Souls */}
              {results.souls.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
                      Souls
                    </span>
                  </div>
                  {navigationItems
                    .filter((item) => item.type === 'soul')
                    .map((item, idx) => {
                      const globalIndex = navigationItems.indexOf(item)
                      return (
                        <button
                          key={`soul-${item.slug}`}
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            w-full px-4 py-2.5 text-left transition-colors
                            ${selectedIndex === globalIndex ? 'bg-elevated' : 'hover:bg-elevated/50'}
                          `}
                        >
                          <div className="text-sm text-text font-medium truncate">{item.name}</div>
                          {item.tagline && (
                            <div className="text-xs text-text-muted truncate mt-0.5">
                              {item.tagline}
                            </div>
                          )}
                        </button>
                      )
                    })}
                </>
              )}

              {/* Categories */}
              {results.categories.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
                      Categories
                    </span>
                  </div>
                  {navigationItems
                    .filter((item) => item.type === 'category')
                    .map((item) => {
                      const globalIndex = navigationItems.indexOf(item)
                      return (
                        <button
                          key={`cat-${item.slug}`}
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors
                            ${selectedIndex === globalIndex ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
                          `}
                        >
                          {item.icon && <span>{item.icon}</span>}
                          <span>Browse {item.name}</span>
                        </button>
                      )
                    })}
                </>
              )}

              {/* View all */}
              {navigationItems.some((item) => item.type === 'view-all') && (
                <>
                  <div className="border-t border-border" />
                  {navigationItems
                    .filter((item) => item.type === 'view-all')
                    .map((item) => {
                      const globalIndex = navigationItems.indexOf(item)
                      return (
                        <button
                          key="view-all"
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            w-full px-4 py-2.5 text-left text-sm transition-colors
                            ${selectedIndex === globalIndex ? 'bg-elevated text-text' : 'text-text-secondary hover:bg-elevated/50'}
                          `}
                        >
                          View all results for "{query}"
                        </button>
                      )
                    })}
                </>
              )}

              {/* No results */}
              {results.souls.length === 0 && results.categories.length === 0 && (
                <div className="px-4 py-3 text-sm text-text-muted">
                  No results found for "{query}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
