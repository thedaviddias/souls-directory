import { confirm } from '@tauri-apps/plugin-dialog'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from '../hooks/useDebounce'
import { useModalAccessibility } from '../hooks/useModalAccessibility'
import { toSoulDisplayRepo } from '../lib/repo-display'
import { invoke } from '../lib/tauri'
import type { Favorites, RepoGroup, RepoInfo, Selection, Soul } from '../types/soul'

interface ContextMenuState {
  x: number
  y: number
  type: 'repo' | 'soul'
  repoKey?: string
  isCustomRepo?: boolean
  soulId?: string
}

interface SidebarProps {
  souls: Soul[]
  repos: RepoInfo[]
  loading: boolean
  error: string | null
  selection: Selection
  onSelectionChange: (selection: Selection) => void
  onRefresh: () => void
  onOpenSettings: () => void
  favorites: Favorites
  onToggleRepoFavorite: (repoKey: string) => void
  onToggleSoulFavorite: (soulId: string) => void
  isRepoFavorite: (repoKey: string) => boolean
  isSoulFavorite: (soulId: string) => boolean
}

type FilterType = 'all' | 'fetched' | 'installed'

export function Sidebar({
  souls,
  repos,
  loading,
  error,
  selection,
  onSelectionChange,
  onRefresh,
  onOpenSettings,
  onToggleRepoFavorite,
  onToggleSoulFavorite,
  isRepoFavorite,
  isSoulFavorite,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sourcesExpanded, setSourcesExpanded] = useState(true)
  const [soulsExpanded, setSoulsExpanded] = useState(true)
  const [showAddRepo, setShowAddRepo] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const closeAddRepo = useCallback(() => {
    setShowAddRepo(false)
    setRepoUrl('')
    setAddError(null)
  }, [])
  const { modalRef: addRepoModalRef, handleKeyDown: addRepoKeyDown } = useModalAccessibility(
    showAddRepo,
    closeAddRepo
  )

  // Close context menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddRepo) {
          setShowAddRepo(false)
          setRepoUrl('')
          setAddError(null)
        }
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAddRepo])

  // Listen for command palette custom events
  useEffect(() => {
    const handleRefresh = () => onRefresh()
    const handleSettings = () => onOpenSettings()
    window.addEventListener('souls-studio:refresh', handleRefresh)
    window.addEventListener('souls-studio:open-settings', handleSettings)
    return () => {
      window.removeEventListener('souls-studio:refresh', handleRefresh)
      window.removeEventListener('souls-studio:open-settings', handleSettings)
    }
  }, [onRefresh, onOpenSettings])

  const handleRepoContextMenu = (e: React.MouseEvent, repoKey: string, isCustom: boolean) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'repo', repoKey, isCustomRepo: isCustom })
  }

  const handleSoulContextMenu = (e: React.MouseEvent, soulId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'soul', soulId })
  }

  const repoGroups = useMemo((): RepoGroup[] => {
    return repos.map((repo) => {
      const repoSouls = souls.filter((s) => s.owner === repo.owner && s.repo === repo.repo)
      return {
        owner: repo.owner,
        repo: repo.repo,
        souls: repoSouls,
        isFetched: repo.isFetched,
        isCustom: repo.isCustom,
      }
    })
  }, [repos, souls])

  const filteredRepoGroups = useMemo(() => {
    return repoGroups.filter((group) => {
      const displayRepo = toSoulDisplayRepo(group.owner, group.repo)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'fetched' && group.isFetched) ||
        (filter === 'installed' && group.souls.some((s) => s.isInstalled))
      const matchesSearch =
        debouncedSearch === '' ||
        `${group.owner}/${group.repo}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        displayRepo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        group.souls.some(
          (s) =>
            s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            s.description.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      return matchesFilter && matchesSearch
    })
  }, [repoGroups, filter, debouncedSearch])

  const filteredSouls = useMemo(() => {
    return souls.filter((soul) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'fetched' && soul.isFetched) ||
        (filter === 'installed' && soul.isInstalled)
      const matchesSearch =
        debouncedSearch === '' ||
        soul.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        soul.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        `${soul.owner}/${soul.repo}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        toSoulDisplayRepo(soul.owner, soul.repo)
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [souls, filter, debouncedSearch])

  const handleAddRepo = async () => {
    if (!repoUrl.trim()) return

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/)
    if (!match) {
      setAddError('Invalid GitHub URL')
      return
    }

    const owner = match[1]
    const repo = match[2].replace(/\.git$/, '')

    setAdding(true)
    setAddError(null)

    try {
      await invoke('add_custom_repo', { owner, repo })
      setRepoUrl('')
      setShowAddRepo(false)
      onRefresh()
      toast.success(`Added ${owner}/${repo}`)
    } catch (e) {
      setAddError(String(e))
      toast.error('Failed to add repository')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveRepo = async (repoKey: string) => {
    const confirmed = await confirm(`Remove "${repoKey}" from your sources?`, {
      title: 'Remove Repository',
      kind: 'warning',
      okLabel: 'Remove',
      cancelLabel: 'Cancel',
    })
    if (!confirmed) return

    const [owner, repo] = repoKey.split('/')
    try {
      await invoke('remove_custom_repo', { owner, repo })
      setContextMenu(null)
      onRefresh()
      toast.success(`Removed ${repoKey}`)
    } catch (e) {
      console.error('Failed to remove repo:', e)
      toast.error('Failed to remove repository')
    }
  }

  const isRepoSelected = (group: RepoGroup) =>
    selection.type === 'repo' &&
    selection.repo.owner === group.owner &&
    selection.repo.repo === group.repo

  const isSoulSelected = (soul: Soul) => selection.type === 'soul' && selection.soul.id === soul.id

  return (
    <nav
      className="w-72 bg-[var(--bg-secondary)] sidebar-source-list border-r border-[var(--border)] flex flex-col h-full"
      aria-label="Soul explorer"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <h1 className="font-semibold text-[var(--text-primary)]">Souls Studio</h1>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors btn-press"
            aria-label="Refresh sources"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors btn-press"
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search souls..."
            aria-label="Search souls"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        {/* Filter Pills */}
        <div
          className="segmented-control mt-2.5 w-full"
          role="radiogroup"
          aria-label="Filter souls"
        >
          <div
            className="segmented-control-indicator"
            style={{
              width: `calc(${100 / 3}% - 2px)`,
              transform: `translateX(${(['all', 'fetched', 'installed'] as FilterType[]).indexOf(filter) * 100}%)`,
            }}
          />
          {(['all', 'fetched', 'installed'] as FilterType[]).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={`segmented-control-item flex-1 text-center capitalize ${filter === f ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-[11px] text-[var(--text-muted)] border-b border-[var(--border)]">
          Browse and install souls from GitHub repositories.
        </div>
        {loading ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading souls">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <div className="w-3.5 h-3.5 rounded skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 skeleton w-3/4" />
                  <div className="h-2.5 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={onRefresh}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            {/* Sources Section */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-expanded={sourcesExpanded}
              >
                {sourcesExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                )}
                <FolderGit2 className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Sources</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                  {filteredRepoGroups.length}
                </span>
              </button>
              {sourcesExpanded && (
                <div className="pb-2" role="list" aria-label="Source repositories">
                  {filter === 'all' && (
                    <button
                      onClick={() => setShowAddRepo(true)}
                      className="w-full px-3 py-2 flex items-center gap-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-tertiary)] cursor-pointer mx-2 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Repository</span>
                    </button>
                  )}
                  {filteredRepoGroups.map((group) => {
                    const repoKey = `${group.owner}/${group.repo}`
                    const isFavorite = isRepoFavorite(repoKey)
                    return (
                      <button
                        key={repoKey}
                        role="listitem"
                        onClick={() => onSelectionChange({ type: 'repo', repo: group })}
                        onContextMenu={(e) =>
                          handleRepoContextMenu(e, repoKey, group.isCustom || false)
                        }
                        className={`w-full px-3 py-2 flex items-center gap-2 text-sm text-left transition-colors mx-2 rounded-lg ${
                          isRepoSelected(group)
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {isFavorite ? (
                          <Star
                            className="w-3.5 h-3.5 text-amber-500 fill-amber-500"
                            aria-label="Favorite"
                          />
                        ) : group.isFetched ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" aria-label="Fetched" />
                        ) : (
                          <Download
                            className="w-3.5 h-3.5 text-[var(--text-muted)]"
                            aria-label="Not fetched"
                          />
                        )}
                        <span className="truncate">
                          {toSoulDisplayRepo(group.owner, group.repo)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {group.souls.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Souls Section */}
            <div>
              <button
                onClick={() => setSoulsExpanded(!soulsExpanded)}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-expanded={soulsExpanded}
              >
                {soulsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                )}
                <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Souls</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                  {filteredSouls.length}
                </span>
              </button>
              {soulsExpanded && (
                <div className="pb-2" role="list" aria-label="Available souls">
                  {filteredSouls.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-[var(--text-muted)] ml-6">
                      No souls found
                    </div>
                  ) : (
                    filteredSouls.map((soul) => {
                      const isFavorite = isSoulFavorite(soul.id)
                      return (
                        <button
                          key={soul.id}
                          role="listitem"
                          onClick={() => onSelectionChange({ type: 'soul', soul: soul })}
                          onContextMenu={(e) => handleSoulContextMenu(e, soul.id)}
                          className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors mx-2 rounded-lg ${
                            isSoulSelected(soul)
                              ? 'bg-[var(--accent)]/15'
                              : 'hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isFavorite && (
                                <Star
                                  className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0"
                                  aria-label="Favorite"
                                />
                              )}
                              <span
                                className={`text-sm truncate ${
                                  isSoulSelected(soul)
                                    ? 'text-[var(--accent)] font-medium'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {soul.name}
                              </span>
                              {soul.isInstalled && (
                                <Check
                                  className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                                  aria-label="Installed"
                                />
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              {soul.description}
                            </p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Repo Modal */}
      {showAddRepo && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-repo-title"
          onKeyDown={addRepoKeyDown}
        >
          <div
            ref={addRepoModalRef}
            className="bg-[var(--bg-secondary)] rounded-xl max-w-sm w-full shadow-2xl border border-[var(--border)] animate-fade-in-scale"
          >
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 id="add-repo-title" className="font-medium text-[var(--text-primary)]">
                Add Repository
              </h3>
              <button
                onClick={closeAddRepo}
                className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="p-4">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                aria-label="Repository URL"
                aria-invalid={!!addError}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                autoFocus
              />
              {addError && (
                <p className="text-xs mt-2" style={{ color: 'var(--error)' }} role="alert">
                  {addError}
                </p>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Enter a GitHub URL containing Claude souls
              </p>
              <button
                onClick={handleAddRepo}
                disabled={adding || !repoUrl.trim()}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium btn-press"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {adding ? 'Adding...' : 'Add Repository'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          className="fixed bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'repo' && contextMenu.repoKey && (
            <>
              <button
                role="menuitem"
                onClick={() => {
                  onToggleRepoFavorite(contextMenu.repoKey!)
                  setContextMenu(null)
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <Star
                  className={`w-4 h-4 ${isRepoFavorite(contextMenu.repoKey) ? 'text-amber-500 fill-amber-500' : 'text-[var(--text-muted)]'}`}
                />
                {isRepoFavorite(contextMenu.repoKey) ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              {contextMenu.isCustomRepo && (
                <button
                  role="menuitem"
                  onClick={() => handleRemoveRepo(contextMenu.repoKey!)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Repository
                </button>
              )}
            </>
          )}
          {contextMenu.type === 'soul' && contextMenu.soulId && (
            <button
              role="menuitem"
              onClick={() => {
                onToggleSoulFavorite(contextMenu.soulId!)
                setContextMenu(null)
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Star
                className={`w-4 h-4 ${isSoulFavorite(contextMenu.soulId) ? 'text-amber-500 fill-amber-500' : 'text-[var(--text-muted)]'}`}
              />
              {isSoulFavorite(contextMenu.soulId) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
