import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGitHubImport } from '../use-github-import'

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

describe('useGitHubImport', () => {
  const onContentFound = vi.fn()

  beforeEach(() => {
    onContentFound.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('fetch not mocked')))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets error when URL is invalid and detect is called', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('not-a-url')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
    expect(onContentFound).not.toHaveBeenCalled()
  })

  it('sets error when host is not github.com', async () => {
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://gitlab.com/owner/repo')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.error).toBe('Please enter a valid GitHub URL')
  })

  it('calls onContentFound and sets githubSource when SOUL.md is found at root', async () => {
    const content = '# SOUL.md - Test'
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('raw.githubusercontent.com') && url.includes('SOUL.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content),
          } as Response)
        }
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sha: 'abc123' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })
    )
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://github.com/owner/repo')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.githubSource).toEqual({
      url: 'https://github.com/owner/repo',
      owner: 'owner',
      repo: 'repo',
      ref: 'HEAD',
      commit: 'abc123',
      path: 'SOUL.md',
    })
    expect(onContentFound).toHaveBeenCalledWith(content)
  })

  it('tries soul.md when SOUL.md returns 404', async () => {
    const content = '# soul'
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('soul.md') && !url.includes('SOUL.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content),
          } as Response)
        }
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sha: 'def456' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })
    )
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://github.com/foo/bar')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.githubSource?.path).toBe('soul.md')
    expect(onContentFound).toHaveBeenCalledWith(content)
  })

  it('sets error when SOUL.md is not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false } as Response))
    )
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://github.com/owner/repo')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.error).toContain('Could not find SOUL.md')
    expect(result.current.githubSource).toBeNull()
    expect(onContentFound).not.toHaveBeenCalled()
  })

  it('reset clears githubSource and calls onContentFound with empty string', async () => {
    const content = '# SOUL.md'
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('raw.githubusercontent.com') && url.includes('SOUL.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content),
          } as Response)
        }
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sha: 'x' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })
    )
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://github.com/a/b')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.githubSource).not.toBeNull()
    act(() => {
      result.current.reset()
    })
    expect(result.current.githubSource).toBeNull()
    expect(onContentFound).toHaveBeenLastCalledWith('')
  })

  it('parses tree URL and tries path for SOUL.md', async () => {
    const content = '# SOUL.md in subdir'
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('raw.githubusercontent.com') && url.includes('docs/soul.md')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content),
          } as Response)
        }
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sha: 'sha1' }),
          } as Response)
        }
        return Promise.resolve({ ok: false } as Response)
      })
    )
    const { result } = renderHook(() => useGitHubImport(onContentFound))
    result.current.setGithubUrl('https://github.com/owner/repo/tree/main/docs')
    await act(async () => {
      await result.current.detect()
    })
    expect(result.current.githubSource?.path).toBe('docs/soul.md')
    expect(result.current.githubSource?.ref).toBe('main')
    expect(onContentFound).toHaveBeenCalledWith(content)
  })
})
