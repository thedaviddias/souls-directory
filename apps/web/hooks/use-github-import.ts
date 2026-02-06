'use client'

import { useAnalytics } from '@/hooks/use-analytics'
import { logger } from '@/lib/logger'
import { formatPublishError } from '@/lib/upload-utils'
import { useCallback, useState } from 'react'

interface GitHubSource {
  url: string
  owner: string
  repo: string
  ref: string
  commit: string
  path?: string
}

function parseGitHubUrl(input: string): {
  owner: string
  repo: string
  ref?: string
  path?: string
} | null {
  try {
    const url = new URL(input)
    if (url.hostname !== 'github.com') return null

    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length < 2) return null

    const owner = segments[0]
    const repo = segments[1].replace(/\.git$/, '')

    if (segments.length === 2) {
      return { owner, repo }
    }

    const kind = segments[2]
    if (kind === 'tree' || kind === 'blob') {
      const ref = segments[3]
      const path = segments.slice(4).join('/')
      return { owner, repo, ref, path: path || undefined }
    }

    return { owner, repo }
  } catch {
    return null
  }
}

interface UseGitHubImportReturn {
  /** The GitHub URL input value */
  githubUrl: string
  setGithubUrl: (v: string) => void
  /** Parsed GitHub source info (set after successful detection) */
  githubSource: GitHubSource | null
  /** Whether detection is in progress */
  isDetecting: boolean
  /** Error message from detection */
  error: string | null
  /** Detect SOUL.md at the given URL and call onContentFound with the content */
  detect: () => Promise<void>
  /** Reset the import state to try a different URL */
  reset: () => void
}

/**
 * Manages GitHub import: URL parsing, SOUL.md detection, and content fetching.
 * Calls `onContentFound` when content is successfully fetched.
 */
export function useGitHubImport(onContentFound: (content: string) => void): UseGitHubImportReturn {
  const analytics = useAnalytics()
  const [githubUrl, setGithubUrl] = useState('')
  const [githubSource, setGithubSource] = useState<GitHubSource | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detect = useCallback(async () => {
    const parsed = parseGitHubUrl(githubUrl.trim())
    if (!parsed) {
      setError('Please enter a valid GitHub URL')
      return
    }

    setIsDetecting(true)
    setError(null)

    try {
      const { owner, repo, ref = 'HEAD', path } = parsed

      const soulPaths = path ? [`${path}/SOUL.md`, `${path}/soul.md`] : ['SOUL.md', 'soul.md']

      let foundContent: string | null = null
      let foundPath = ''

      for (const tryPath of soulPaths) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${tryPath}`
          const response = await fetch(rawUrl)
          if (response.ok) {
            foundContent = await response.text()
            foundPath = tryPath
            break
          }
        } catch {
          // Try next path
        }
      }

      if (!foundContent) {
        setError(
          'Could not find SOUL.md in this repository. Make sure the file exists at the root or in the specified path.'
        )
        return
      }

      // Get actual commit SHA
      let commit = ref
      if (ref === 'HEAD' || !ref.match(/^[a-f0-9]{40}$/)) {
        try {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${ref || 'HEAD'}`
          const response = await fetch(apiUrl)
          if (response.ok) {
            const data = await response.json()
            commit = data.sha
          }
        } catch {
          // Use ref as-is
        }
      }

      const url = githubUrl.trim()
      setGithubSource({
        url,
        owner,
        repo,
        ref: ref || 'HEAD',
        commit,
        path: foundPath,
      })
      analytics.track('github_import', { url })
      onContentFound(foundContent)
    } catch (err) {
      logger.error('GitHub import failed', err, { url: githubUrl.trim() })
      setError(formatPublishError(err))
    } finally {
      setIsDetecting(false)
    }
  }, [analytics, githubUrl, onContentFound])

  const reset = useCallback(() => {
    setGithubSource(null)
    onContentFound('')
  }, [onContentFound])

  return {
    githubUrl,
    setGithubUrl,
    githubSource,
    isDetecting,
    error,
    detect,
    reset,
  }
}

export type { GitHubSource }
