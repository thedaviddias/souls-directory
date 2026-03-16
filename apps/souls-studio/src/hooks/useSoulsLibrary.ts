import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { RepoInfo, Soul } from '../types/soul'

export function useSoulsLibrary(enabled = true) {
  const [souls, setSouls] = useState<Soul[]>([])
  const [repos, setRepos] = useState<RepoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    if (!isTauriRuntime()) {
      setSouls([])
      setRepos([])
      setError('Desktop APIs unavailable in browser preview. Open the Tauri app build.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [soulsResult, reposResult] = await Promise.all([
        invoke<Soul[]>('get_all_souls'),
        invoke<RepoInfo[]>('get_all_repos'),
      ])
      setSouls(soulsResult)
      setRepos(reposResult)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { souls, repos, loading, error, refresh: fetchData }
}
