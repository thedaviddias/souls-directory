import { renderHook, waitFor } from '@testing-library/react'
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hasDraft is false when no draft in localStorage', async () => {
    const { result } = renderHook(() => useUploadDraft())
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false)
    })
    expect(result.current.loadDraft()).toBeNull()
  })

  it('hasDraft is true when valid draft with content exists', async () => {
    const draft: UploadDraft = {
      ...baseDraft,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    const { result } = renderHook(() => useUploadDraft())
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true)
    })
    const loaded = result.current.loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.content).toBe('# SOUL.md')
    expect(loaded?.displayName).toBe('Test')
  })

  it('hasDraft is false when draft has no content', async () => {
    const draft: UploadDraft = {
      ...baseDraft,
      content: '',
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    const { result } = renderHook(() => useUploadDraft())
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false)
    })
  })

  it('loadDraft returns null for expired draft and removes it', () => {
    const draft: UploadDraft = {
      ...baseDraft,
      savedAt: Date.now() - MAX_AGE_MS - 1,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    const { result } = renderHook(() => useUploadDraft())
    const loaded = result.current.loadDraft()
    expect(loaded).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('saveDraft persists after debounce (500ms)', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useUploadDraft())
    result.current.saveDraft(baseDraft)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(500)
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    })
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    if (raw === null) throw new Error('Expected raw to be set after waitFor')
    const parsed = JSON.parse(raw) as UploadDraft
    expect(parsed.content).toBe(baseDraft.content)
    expect(parsed.savedAt).toBeDefined()
  })

  it('clearDraft removes draft and sets hasDraft false', async () => {
    const draft: UploadDraft = { ...baseDraft, savedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    const { result } = renderHook(() => useUploadDraft())
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true)
    })
    result.current.clearDraft()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(result.current.hasDraft).toBe(false)
  })

  it('loadDraft returns null for invalid JSON and removes key', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const { result } = renderHook(() => useUploadDraft())
    const loaded = result.current.loadDraft()
    expect(loaded).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('saveDraft ignores localStorage errors', async () => {
    vi.useFakeTimers()
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceeded')
    })
    try {
      const { result } = renderHook(() => useUploadDraft())
      result.current.saveDraft(baseDraft)
      vi.advanceTimersByTime(500)
      await waitFor(() => {
        expect(result.current.hasDraft).toBe(false)
      })
    } finally {
      Storage.prototype.setItem = setItem
    }
  })
})
