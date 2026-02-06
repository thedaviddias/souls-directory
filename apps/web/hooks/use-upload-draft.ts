'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

/** All serializable wizard state that we persist across page reloads. */
export interface UploadDraft {
  /** Which step the user was on */
  currentStep: string
  /** File or GitHub */
  sourceType: 'file' | 'github'
  /** Raw markdown content (file upload or GitHub import) */
  content: string
  /** GitHub URL input */
  githubUrl: string
  /** Metadata fields */
  displayName: string
  slug: string
  tagline: string
  description: string
  categoryId: string | null
  selectedTags: string[]
  /** Version info */
  changelog: string
  versionBump: string
  isUpdate: boolean
  /** Timestamp for staleness check */
  savedAt: number
}

const STORAGE_KEY = 'souls-upload-draft'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

// =============================================================================
// Hook
// =============================================================================

/**
 * Persists upload wizard state to localStorage.
 *
 * - Loads saved draft on mount (if less than 24h old)
 * - Saves state on every change (debounced 500ms)
 * - Provides `clearDraft` to remove saved data
 * - Provides `hasDraft` boolean so UI can show "resume" notice
 */
export function useUploadDraft() {
  const [hasDraft, setHasDraft] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -------------------------------------------------------------------------
  // Load draft from localStorage
  // -------------------------------------------------------------------------

  const loadDraft = useCallback((): UploadDraft | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const draft: UploadDraft = JSON.parse(raw)

      // Check staleness
      if (Date.now() - draft.savedAt > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return draft
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  }, [])

  // -------------------------------------------------------------------------
  // Save draft to localStorage (debounced)
  // -------------------------------------------------------------------------

  const saveDraft = useCallback((draft: Omit<UploadDraft, 'savedAt'>) => {
    // Debounce: cancel any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      try {
        const withTimestamp: UploadDraft = {
          ...draft,
          savedAt: Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp))
        setHasDraft(true)
      } catch {
        // localStorage full or unavailable, silently skip
      }
    }, 500)
  }, [])

  // -------------------------------------------------------------------------
  // Clear draft
  // -------------------------------------------------------------------------

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHasDraft(false)
  }, [])

  // -------------------------------------------------------------------------
  // Check if draft exists on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    const draft = loadDraft()
    setHasDraft(draft !== null && draft.content.length > 0)
  }, [loadDraft])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  return {
    /** Whether a resumable draft exists */
    hasDraft,
    /** Load the saved draft (returns null if none or expired) */
    loadDraft,
    /** Save current state (debounced 500ms) */
    saveDraft,
    /** Remove saved draft */
    clearDraft,
  }
}
