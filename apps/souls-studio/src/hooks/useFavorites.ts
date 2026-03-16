import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { Favorites } from '../types/soul'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorites>({ souls: [], repos: [] })
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(async () => {
    if (!isTauriRuntime()) {
      setFavorites({ souls: [], repos: [] })
      setLoading(false)
      return
    }

    try {
      const data = await invoke<Favorites>('get_favorites')
      setFavorites(data)
    } catch (e) {
      console.error('Failed to load favorites:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const toggleSoulFavorite = useCallback(async (soulId: string) => {
    if (!isTauriRuntime()) {
      setFavorites((current) => ({
        ...current,
        souls: current.souls.includes(soulId)
          ? current.souls.filter((id) => id !== soulId)
          : [...current.souls, soulId],
      }))
      return
    }

    try {
      const updated = await invoke<Favorites>('toggle_favorite_soul', { soulId })
      setFavorites(updated)
    } catch (e) {
      console.error('Failed to toggle soul favorite:', e)
    }
  }, [])

  const toggleRepoFavorite = useCallback(async (repoKey: string) => {
    if (!isTauriRuntime()) {
      setFavorites((current) => ({
        ...current,
        repos: current.repos.includes(repoKey)
          ? current.repos.filter((key) => key !== repoKey)
          : [...current.repos, repoKey],
      }))
      return
    }

    try {
      const updated = await invoke<Favorites>('toggle_favorite_repo', { repoKey })
      setFavorites(updated)
    } catch (e) {
      console.error('Failed to toggle repo favorite:', e)
    }
  }, [])

  const isSoulFavorite = useCallback(
    (soulId: string) => {
      return favorites.souls.includes(soulId)
    },
    [favorites.souls]
  )

  const isRepoFavorite = useCallback(
    (repoKey: string) => {
      return favorites.repos.includes(repoKey)
    },
    [favorites.repos]
  )

  return {
    favorites,
    loading,
    toggleSoulFavorite,
    toggleRepoFavorite,
    isSoulFavorite,
    isRepoFavorite,
    refresh: loadFavorites,
  }
}
