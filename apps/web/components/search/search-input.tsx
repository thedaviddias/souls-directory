/**
 * SearchInput - Minimalist search bar with animated typewriter placeholder
 *
 * Design: Typography-first, grayscale palette inspired by cursor.directory
 * - Border-only styling
 * - Animated typewriter placeholder
 * - Keyboard shortcut: "/" to focus, Escape to blur
 */

'use client'

import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { soulsSearchPath } from '@/lib/routes'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  defaultValue?: string
  placeholder?: string
}

export function SearchInput({
  defaultValue = '',
  placeholder = 'Search souls by name, category, or description...',
}: SearchInputProps) {
  const router = useRouter()
  const analytics = useAnalytics()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = value.trim()
    if (query) {
      analytics.track('search', { query })
      router.push(soulsSearchPath(query))
    }
  }

  // Show animated placeholder when input is empty and not focused
  const showAnimatedPlaceholder = !value && !isFocused

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      {/* Visually hidden label for accessibility */}
      <label htmlFor="soul-search" className="sr-only">
        Search for AI personality souls
      </label>

      <div className="relative h-12 border border-border rounded-md bg-surface/50 transition-colors hover:border-text-muted focus-within:border-text-secondary">
        <input
          ref={inputRef}
          id="soul-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          autoComplete="off"
          data-search-input
          aria-describedby="search-hint"
          className="absolute inset-0 w-full h-full bg-transparent rounded-md px-4 pr-28 text-sm text-text font-sans focus:outline-none"
        />

        {/* Animated typewriter placeholder */}
        {showAnimatedPlaceholder && (
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          >
            {placeholder.split('').map((char, index) => (
              <span
                key={`char-${index}-${char}`}
                className="inline-block text-sm text-text-muted"
                style={{
                  opacity: 0,
                  animation: `typewriter-char 0.02s ease forwards ${0.3 + index * 0.015}s`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        )}

        {/* Keyboard hint / Clear + Submit buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {!value && (
            <span
              className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded border border-border bg-elevated text-xs text-text-secondary font-mono"
              aria-hidden="true"
            >
              /
            </span>
          )}
          {value && (
            <>
              <button
                type="button"
                onClick={() => {
                  setValue('')
                  inputRef.current?.focus()
                }}
                className="inline-flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <Button type="submit" variant="secondary" size="sm" aria-label="Submit search">
                Search
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hidden hint for screen readers */}
      <span id="search-hint" className="sr-only">
        Press forward slash to focus search. Press Escape to clear focus.
      </span>
    </form>
  )
}
