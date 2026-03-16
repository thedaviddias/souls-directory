import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toSoulDisplayRepo } from '../lib/repo-display'
import { invoke } from '../lib/tauri'
import type { InstallMethod, Soul } from '../types/soul'

interface SoulDetailProps {
  soul: Soul
  installMethod: InstallMethod
  onClose: () => void
  onInstallChange: () => void
}

export function SoulDetail({ soul, installMethod, onClose, onInstallChange }: SoulDetailProps) {
  const [installing, setInstalling] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayRepo = toSoulDisplayRepo(soul.owner, soul.repo)

  const handleFetch = async () => {
    setFetching(true)
    setError(null)

    try {
      await invoke('fetch_repo', { owner: soul.owner, repo: soul.repo })
      onInstallChange()
    } catch (e) {
      setError(String(e))
    } finally {
      setFetching(false)
    }
  }

  const handleInstall = async () => {
    setInstalling(true)
    setError(null)

    try {
      await invoke('install_soul', {
        owner: soul.owner,
        repo: soul.repo,
        soulName: soul.name,
        method: installMethod,
      })
      onInstallChange()
    } catch (e) {
      setError(String(e))
    } finally {
      setInstalling(false)
    }
  }

  const handleUninstall = async () => {
    setError(null)
    try {
      await invoke('uninstall_soul', { soulName: soul.name })
      onInstallChange()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{soul.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{displayRepo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!soul.isFetched ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                This soul hasn't been fetched yet.
              </p>
              <button
                onClick={handleFetch}
                disabled={fetching}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {fetching ? 'Fetching...' : 'Fetch Repository'}
              </button>
            </div>
          ) : soul.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{soul.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No content available.</p>
          )}
        </div>

        {/* Footer */}
        {soul.isFetched && (
          <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4">
            {error && <p className="text-red-500 text-sm flex-1">{error}</p>}
            {!error && <div className="flex-1" />}

            {soul.isInstalled ? (
              <button
                onClick={handleUninstall}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600
                           transition-colors font-medium"
              >
                Uninstall
              </button>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {installing ? 'Installing...' : 'Install Soul'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
