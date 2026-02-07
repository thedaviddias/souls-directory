import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGitHubImport } from '../use-github-import'

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

// @sentry/nextjs is mocked globally in vitest.setup.ts
// logger and upload-utils can now resolve without hanging

// Helper: sets URL and flushes the state update before calling detect
async function setUrlAndDetect(
  result: { current: ReturnType<typeof useGitHubImport> },
  url: string
) {
  act(() => {
    result.current.setGithubUrl(url)
  })
  // Now the hook has re-rendered with the new URL
  await act(async () => {
    await result.current.detect()
  })
}

function mockFetchForRepo(
  responses: Record<string, { ok: boolean; body?: string; json?: unknown }>
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (url.includes(pattern)) {
          if (response.body !== undefined) {
            return Promise.resolve({
              ok: response.ok,
              text: () => Promise.resolve(response.body),
            } as Response)
          }
          if (response.json !== undefined) {
            return Promise.resolve({
              ok: response.ok,
              json: () => Promise.resolve(response.json),
            } as Response)
          }
          return Promise.resolve({ ok: response.ok } as Response)
        }
      }
      return Promise.resolve({ ok: false } as Response)
    })
  )
}

describe('useGitHubImport', () => {
  const onContentFound = vi.fn()

  beforeEach(() => {
    onContentFound.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('fetch not mocked for this URL')))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ---------------------------------------------------------------------------
  // URL validation — detect should reject before making any network calls
  // ---------------------------------------------------------------------------

  it('rejects empty URL with a user-friendly error', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    // URL is '' by default — detect without setting anything
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
    expect(onContentFound).not.toHaveBeenCalled()
  })

  it('rejects non-URL strings', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'not-a-url')
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
  })

  it('rejects non-GitHub hosts', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://gitlab.com/owner/repo')
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
  })

  it('rejects GitHub URLs without owner/repo path', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/')
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
  })

  // ---------------------------------------------------------------------------
  // Successful SOUL.md detection
  // ---------------------------------------------------------------------------

  it('fetches SOUL.md from repo root and resolves commit SHA', async () => {
    mockFetchForRepo({
      'raw.githubusercontent.com/owner/repo/HEAD/SOUL.md': {
        ok: true,
        body: '# My Soul\nBe helpful and concise.',
      },
      'api.github.com/repos/owner/repo/commits': {
        ok: true,
        json: { sha: 'abc123def456' },
      },
    })

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/owner/repo')

    expect(result.current.error).toBeNull()
    expect(result.current.githubSource).toEqual({
      url: 'https://github.com/owner/repo',
      owner: 'owner',
      repo: 'repo',
      ref: 'HEAD',
      commit: 'abc123def456',
      path: 'SOUL.md',
    })
    expect(onContentFound).toHaveBeenCalledWith('# My Soul\nBe helpful and concise.')
  })

  it('falls back to soul.md (lowercase) when SOUL.md returns 404', async () => {
    mockFetchForRepo({
      // SOUL.md → 404
      'raw.githubusercontent.com/foo/bar/HEAD/SOUL.md': { ok: false },
      // soul.md → found
      'raw.githubusercontent.com/foo/bar/HEAD/soul.md': {
        ok: true,
        body: '# lowercase soul',
      },
      'api.github.com': {
        ok: true,
        json: { sha: 'commit-sha' },
      },
    })

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/foo/bar')

    expect(result.current.githubSource?.path).toBe('soul.md')
    expect(onContentFound).toHaveBeenCalledWith('# lowercase soul')
  })

  it('reports error when neither SOUL.md nor soul.md exists', async () => {
    // All fetches return 404
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false } as Response))
    )

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/owner/empty-repo')

    expect(result.current.error).toContain('Could not find SOUL.md')
    expect(result.current.githubSource).toBeNull()
    expect(onContentFound).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Tree/blob URL parsing
  // ---------------------------------------------------------------------------

  it('handles /tree/branch/path URLs and looks for SOUL.md in subdirectory', async () => {
    mockFetchForRepo({
      'raw.githubusercontent.com/owner/repo/main/docs/SOUL.md': {
        ok: true,
        body: '# Docs soul',
      },
      'api.github.com': {
        ok: true,
        json: { sha: 'tree-sha' },
      },
    })

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/owner/repo/tree/main/docs')

    expect(result.current.githubSource?.path).toBe('docs/SOUL.md')
    expect(result.current.githubSource?.ref).toBe('main')
    expect(onContentFound).toHaveBeenCalledWith('# Docs soul')
  })

  it('strips .git suffix from repo name', async () => {
    mockFetchForRepo({
      'raw.githubusercontent.com/owner/myrepo/HEAD/SOUL.md': {
        ok: true,
        body: '# git suffix test',
      },
      'api.github.com': {
        ok: true,
        json: { sha: 'sha1' },
      },
    })

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/owner/myrepo.git')

    expect(result.current.githubSource?.repo).toBe('myrepo')
    expect(onContentFound).toHaveBeenCalledWith('# git suffix test')
  })

  // ---------------------------------------------------------------------------
  // Reset behavior
  // ---------------------------------------------------------------------------

  it('reset clears githubSource and notifies with empty content', async () => {
    mockFetchForRepo({
      'raw.githubusercontent.com': {
        ok: true,
        body: '# Soul content',
      },
      'api.github.com': {
        ok: true,
        json: { sha: 'x' },
      },
    })

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    await setUrlAndDetect(result, 'https://github.com/a/b')
    expect(result.current.githubSource).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.githubSource).toBeNull()
    // reset should notify parent that content is cleared
    expect(onContentFound).toHaveBeenLastCalledWith('')
  })

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  it('isDetecting is false before and after detect completes', async () => {
    // We can't reliably test the mid-flight isDetecting=true in unit tests
    // because act() batches state updates. Instead, verify the before/after contract.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false } as Response))
    )

    const { result } = renderHook(() => useGitHubImport(onContentFound))
    expect(result.current.isDetecting).toBe(false)

    await setUrlAndDetect(result, 'https://github.com/owner/repo')

    // After detect completes, isDetecting should be false again
    expect(result.current.isDetecting).toBe(false)
  })
})
