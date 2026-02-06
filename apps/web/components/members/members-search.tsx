'use client'

import { Button } from '@/components/ui/button'
import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

/**
 * Simple debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

interface MembersSearchProps {
  initialSearch?: string
}

/**
 * Search component for filtering members.
 * Debounces input and updates URL params.
 * Uses the same input style as SearchInput.
 */
export function MembersSearch({ initialSearch = '' }: MembersSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedSearch === currentSearch) return

    const params = new URLSearchParams(searchParams)

    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }

    // Reset page when search changes
    params.delete('page')

    startTransition(() => {
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(url as Route)
    })
  }, [debouncedSearch, pathname, router, searchParams])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <div className="relative w-full max-w-md">
      <div className="relative h-10 border border-border rounded-md bg-surface/50 transition-colors hover:border-text-muted focus-within:border-text-secondary">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="absolute inset-0 w-full h-full bg-transparent rounded-md px-4 pr-16 text-sm text-text font-sans placeholder:text-text-muted focus:outline-none"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isPending && (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border border-text border-t-transparent" />
          )}
          {searchQuery && !isPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs font-mono h-auto py-0"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
