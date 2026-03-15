'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

/** All serializable wizard state that we persist across page reloads. */
export interface UploadDraft {
  /** Which step the user was on */
  currentStep: string
  /** File, GitHub, or pasted content */
  sourceType: 'file' | 'github' | 'paste'
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

export const UPLOAD_DRAFT_STORAGE_KEY = 'souls-upload-draft'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function loadUploadDraft(): UploadDraft | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(UPLOAD_DRAFT_STORAGE_KEY)
    if (!raw) return null

    const draft: UploadDraft = JSON.parse(raw)

    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      storage.removeItem(UPLOAD_DRAFT_STORAGE_KEY)
      return null
    }

    return draft
  } catch {
    storage.removeItem(UPLOAD_DRAFT_STORAGE_KEY)
    return null
  }
}

export function saveUploadDraftNow(draft: Omit<UploadDraft, 'savedAt'>): boolean {
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.setItem(
      UPLOAD_DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...draft,
        savedAt: Date.now(),
      } satisfies UploadDraft)
    )
    return true
  } catch {
    return false
  }
}

export function clearUploadDraftStorage() {
  const storage = getStorage()
  storage?.removeItem(UPLOAD_DRAFT_STORAGE_KEY)
}

export function consumeUploadDraft(): UploadDraft | null {
  const draft = loadUploadDraft()
  if (!draft) return null
  clearUploadDraftStorage()
  return draft
}

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
    return loadUploadDraft()
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
      const saved = saveUploadDraftNow(draft)
      if (saved) {
        setHasDraft(true)
      }
    }, 500)
  }, [])

  // -------------------------------------------------------------------------
  // Clear draft
  // -------------------------------------------------------------------------

  const clearDraft = useCallback(() => {
    clearUploadDraftStorage()
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
