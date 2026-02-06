'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseClipboardOptions {
  /** Time in ms before resetting copied state */
  resetDelay?: number
  /** Callback when copy succeeds */
  onSuccess?: () => void
  /** Callback when copy fails */
  onError?: (error: Error) => void
}

interface UseClipboardReturn {
  /** Whether text was recently copied */
  copied: boolean
  /** Copy text to clipboard */
  copy: (text: string) => Promise<void>
  /** Reset copied state */
  reset: () => void
}

/**
 * Hook for copying text to clipboard with state management
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { resetDelay = 2000, onSuccess, onError } = options
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        onSuccess?.()

        // Clear any existing timeout before setting a new one
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        if (resetDelay > 0) {
          timeoutRef.current = setTimeout(() => setCopied(false), resetDelay)
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Failed to copy'))
      }
    },
    [resetDelay, onSuccess, onError]
  )

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setCopied(false)
  }, [])

  return { copied, copy, reset }
}
