import { useState } from 'react'
import { toSoulDisplayRepo } from '../lib/repo-display'
import { invoke } from '../lib/tauri'

interface RepoCardProps {
  owner: string
  repo: string
  soulCount: number
  lastFetched?: string
  onFetchComplete: () => void
}

function formatDate(timestamp?: string): string {
  if (!timestamp) return 'Never'
  const secs = Number.parseInt(timestamp, 10)
  if (isNaN(secs)) return timestamp
  const date = new Date(secs * 1000)
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

export function RepoCard({ owner, repo, soulCount, lastFetched, onFetchComplete }: RepoCardProps) {
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayRepo = toSoulDisplayRepo(owner, repo)

  const handleFetch = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setFetching(true)
    setError(null)

    try {
      await invoke('fetch_repo', { owner, repo })
      onFetchComplete()
    } catch (err) {
      setError(String(err))
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{displayRepo}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {soulCount} soul{soulCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetching ? 'Fetching...' : lastFetched ? 'Sync' : 'Fetch'}
          </button>
          {lastFetched && <p className="text-xs text-gray-400 mt-1">{formatDate(lastFetched)}</p>}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
