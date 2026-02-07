import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UploadDraft } from '../use-upload-draft'
import { useUploadDraft } from '../use-upload-draft'

const STORAGE_KEY = 'souls-upload-draft'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

const baseDraft: Omit<UploadDraft, 'savedAt'> = {
  currentStep: 'metadata',
  sourceType: 'file',
  content: '# SOUL.md',
  githubUrl: '',
  displayName: 'Test',
  slug: 'test',
  tagline: 'A test soul',
  description: '',
  categoryId: null,
  selectedTags: [],
  changelog: '',
  versionBump: 'patch',
  isUpdate: false,
}

describe('useUploadDraft', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // Initial state detection
  // ---------------------------------------------------------------------------

  it('reports no draft when localStorage is empty', () => {
    const { result } = renderHook(() => useUploadDraft())
    // useEffect runs synchronously in test with forks pool
    expect(result.current.hasDraft).toBe(false)
    expect(result.current.loadDraft()).toBeNull()
  })

  it('detects existing draft with content on mount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...baseDraft, savedAt: Date.now() }))
    const { result } = renderHook(() => useUploadDraft())
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true)
    })
  })

  it('ignores existing draft if content is empty (nothing to resume)', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...baseDraft, content: '', savedAt: Date.now() })
    )
    const { result } = renderHook(() => useUploadDraft())
    // Draft with no content shouldn't be resumable
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Staleness / expiry
  // ---------------------------------------------------------------------------

  it('treats drafts older than 24h as expired and removes them', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...baseDraft, savedAt: Date.now() - MAX_AGE_MS - 1 })
    )
    const { result } = renderHook(() => useUploadDraft())
    expect(result.current.loadDraft()).toBeNull()
    // Should have cleaned up localStorage too
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps drafts that are exactly at the age boundary', () => {
    // Edge case: exactly MAX_AGE_MS old should still be valid (not expired)
    const savedAt = Date.now() - MAX_AGE_MS + 100 // just under the limit
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...baseDraft, savedAt }))
    const { result } = renderHook(() => useUploadDraft())
    const loaded = result.current.loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.content).toBe('# SOUL.md')
  })

  // ---------------------------------------------------------------------------
  // Corrupt data handling
  // ---------------------------------------------------------------------------

  it('handles corrupt JSON in localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{')
    const { result } = renderHook(() => useUploadDraft())
    expect(result.current.loadDraft()).toBeNull()
    // Should clean up the corrupt entry
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // saveDraft debounce behavior
  // ---------------------------------------------------------------------------

  it('does not persist immediately - waits for debounce', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUploadDraft())

    act(() => {
      result.current.saveDraft(baseDraft)
    })

    // Should NOT be in localStorage yet
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    vi.useRealTimers()
  })

  it('persists to localStorage after 500ms debounce', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUploadDraft())

    act(() => {
      result.current.saveDraft(baseDraft)
    })

    // Advance past the debounce
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw ?? '') as UploadDraft
    expect(parsed.content).toBe('# SOUL.md')
    expect(parsed.displayName).toBe('Test')
    expect(typeof parsed.savedAt).toBe('number')
  })

  it('only persists the last call when saveDraft is called rapidly', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUploadDraft())

    // First save
    act(() => {
      result.current.saveDraft({ ...baseDraft, displayName: 'First' })
    })

    // 200ms later, second save (before first debounce fires)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    act(() => {
      result.current.saveDraft({ ...baseDraft, displayName: 'Second' })
    })

    // Complete the second debounce
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw ?? '') as UploadDraft
    // Should have the SECOND value, not the first
    expect(parsed.displayName).toBe('Second')
  })

  // ---------------------------------------------------------------------------
  // clearDraft
  // ---------------------------------------------------------------------------

  it('clearDraft removes the draft and updates hasDraft', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...baseDraft, savedAt: Date.now() }))
    const { result } = renderHook(() => useUploadDraft())

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true)
    })

    act(() => {
      result.current.clearDraft()
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.hasDraft).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Error resilience
  // ---------------------------------------------------------------------------

  it('saveDraft silently fails when localStorage throws (e.g. quota exceeded)', async () => {
    vi.useFakeTimers()
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError')
    })

    try {
      const { result } = renderHook(() => useUploadDraft())

      act(() => {
        result.current.saveDraft(baseDraft)
      })

      // Should not throw when the debounce fires
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // hasDraft should still be false because save failed
      expect(result.current.hasDraft).toBe(false)
    } finally {
      Storage.prototype.setItem = originalSetItem
    }
  })

  // ---------------------------------------------------------------------------
  // loadDraft data integrity
  // ---------------------------------------------------------------------------

  it('loadDraft preserves all draft fields round-trip', async () => {
    const fullDraft: Omit<UploadDraft, 'savedAt'> = {
      currentStep: 'review',
      sourceType: 'github',
      content: '# My Agent\nBe helpful.',
      githubUrl: 'https://github.com/foo/bar',
      displayName: 'My Agent',
      slug: 'my-agent',
      tagline: 'A helpful agent',
      description: 'Detailed description here',
      categoryId: 'cat-123',
      selectedTags: ['tag-1', 'tag-2'],
      changelog: 'Initial release',
      versionBump: 'minor',
      isUpdate: true,
    }

    vi.useFakeTimers()
    const { result } = renderHook(() => useUploadDraft())

    act(() => {
      result.current.saveDraft(fullDraft)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    vi.useRealTimers()

    const loaded = result.current.loadDraft()
    expect(loaded).not.toBeNull()
    // Every field should survive the round-trip
    expect(loaded?.currentStep).toBe('review')
    expect(loaded?.sourceType).toBe('github')
    expect(loaded?.content).toBe('# My Agent\nBe helpful.')
    expect(loaded?.githubUrl).toBe('https://github.com/foo/bar')
    expect(loaded?.displayName).toBe('My Agent')
    expect(loaded?.slug).toBe('my-agent')
    expect(loaded?.tagline).toBe('A helpful agent')
    expect(loaded?.description).toBe('Detailed description here')
    expect(loaded?.categoryId).toBe('cat-123')
    expect(loaded?.selectedTags).toEqual(['tag-1', 'tag-2'])
    expect(loaded?.changelog).toBe('Initial release')
    expect(loaded?.versionBump).toBe('minor')
    expect(loaded?.isUpdate).toBe(true)
  })
})
