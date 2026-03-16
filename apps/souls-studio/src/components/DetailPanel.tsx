import { confirm } from '@tauri-apps/plugin-dialog'
import MarkdownPreview from '@uiw/react-markdown-preview'
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  FolderOpen,
  Github,
  GripVertical,
  PackagePlus,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { toast } from 'sonner'
import { toSoulDisplayRepo } from '../lib/repo-display'
import { invoke } from '../lib/tauri'
import type { InstallMethod, Selection, Soul } from '../types/soul'

interface DetailPanelProps {
  selection: Selection
  souls: Soul[]
  installMethod: InstallMethod
  onRefresh: () => void
  onToggleSoulFavorite: (soulId: string) => void
  isSoulFavorite: (soulId: string) => boolean
}

export function DetailPanel({
  selection,
  souls,
  installMethod,
  onRefresh,
  onToggleSoulFavorite,
  isSoulFavorite,
}: DetailPanelProps) {
  const [installing, setInstalling] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repoReadme, setRepoReadme] = useState<string | null>(null)
  const [loadingReadme, setLoadingReadme] = useState(false)
  const [selectedSoulInRepo, setSelectedSoulInRepo] = useState<Soul | null>(null)
  const [viewMode, setViewMode] = useState<'readme' | 'soul'>('readme')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; soulId: string } | null>(
    null
  )
  const [localFetched, setLocalFetched] = useState(false)

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Update selectedSoulInRepo when souls array changes (after install/uninstall)
  useEffect(() => {
    if (selectedSoulInRepo) {
      const updatedSoul = souls.find((s) => s.id === selectedSoulInRepo.id)
      if (updatedSoul) {
        setSelectedSoulInRepo(updatedSoul)
      }
    }
  }, [souls])

  // Sync localFetched with repo.isFetched when it becomes true from backend
  useEffect(() => {
    if (selection.type === 'repo' && selection.repo.isFetched && !localFetched) {
      setLocalFetched(true)
    }
  }, [selection, localFetched])

  // Track which repo we're viewing to detect actual repo changes
  const currentRepoKey =
    selection.type === 'repo' ? `${selection.repo.owner}/${selection.repo.repo}` : null

  // Fetch README from GitHub raw URL - only when repo actually changes
  useEffect(() => {
    if (selection.type === 'repo') {
      setLoadingReadme(true)
      const rawUrl = `https://raw.githubusercontent.com/${selection.repo.owner}/${selection.repo.repo}/main/README.md`
      fetch(rawUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Not found')
          return res.text()
        })
        .then((readme) => {
          setRepoReadme(readme)
        })
        .catch(() => {
          // Try master branch if main doesn't exist
          const masterUrl = `https://raw.githubusercontent.com/${selection.repo.owner}/${selection.repo.repo}/master/README.md`
          fetch(masterUrl)
            .then((res) => {
              if (!res.ok) throw new Error('Not found')
              return res.text()
            })
            .then((readme) => {
              setRepoReadme(readme)
            })
            .catch(() => {
              setRepoReadme(null)
            })
        })
        .finally(() => {
          setLoadingReadme(false)
        })
      // Reset soul selection and view mode when repo changes
      setSelectedSoulInRepo(null)
      setViewMode('readme')
      setLocalFetched(false)
    } else {
      setRepoReadme(null)
      setSelectedSoulInRepo(null)
      setViewMode('readme')
      setLocalFetched(false)
    }
  }, [currentRepoKey]) // Only trigger when actual repo changes, not selection object reference

  // Empty state
  if (selection.type === 'none') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center animate-fade-in-up">
          <div className="empty-state-icon">
            <Sparkles aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">No selection</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
            Select a source or soul to view details
          </p>
        </div>
      </div>
    )
  }

  // Repo view
  if (selection.type === 'repo') {
    const repo = selection.repo
    const displayRepo = toSoulDisplayRepo(repo.owner, repo.repo)
    const githubUrl = `https://github.com/${repo.owner}/${repo.repo}`
    const repoSouls = souls.filter((s) => s.owner === repo.owner && s.repo === repo.repo)

    const handleFetchRepo = async () => {
      setFetching(true)
      setError(null)
      try {
        await invoke('fetch_repo', { owner: repo.owner, repo: repo.repo })
        setLocalFetched(true)
        onRefresh()
        toast.success(`Fetched souls from ${displayRepo}`)
      } catch (e) {
        setError(String(e))
        toast.error('Failed to fetch repository')
      } finally {
        setFetching(false)
      }
    }

    const handleInstallSoul = async (soul: Soul) => {
      setInstalling(soul.id)
      setError(null)
      try {
        await invoke('install_soul', {
          owner: soul.owner,
          repo: soul.repo,
          soulName: soul.name,
          soulPath: soul.path,
          soulsPath: soul.soulsPath,
          method: installMethod,
        })
        onRefresh()
        toast.success(`Installed "${soul.name}"`)
      } catch (e) {
        setError(String(e))
        toast.error(`Failed to install "${soul.name}"`)
      } finally {
        setInstalling(null)
      }
    }

    const handleUninstallSoul = async (soul: Soul) => {
      const confirmed = await confirm(`Uninstall "${soul.name}"?`, {
        title: 'Uninstall Soul',
        kind: 'warning',
        okLabel: 'Uninstall',
        cancelLabel: 'Cancel',
      })
      if (!confirmed) return

      setError(null)
      try {
        await invoke('uninstall_soul', { soulName: soul.name })
        onRefresh()
        toast.success(`Uninstalled "${soul.name}"`)
      } catch (e) {
        setError(String(e))
        toast.error(`Failed to uninstall "${soul.name}"`)
      }
    }

    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
              <FolderGit2 className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">{displayRepo}</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {repoSouls.length} soul{repoSouls.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors btn-press"
              aria-label={`Open ${displayRepo} on GitHub`}
            >
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
            </a>

            {/* Show soul actions when a soul is selected, otherwise show Fetch Souls */}
            {viewMode === 'soul' && selectedSoulInRepo ? (
              <>
                {selectedSoulInRepo.isInstalled && (
                  <button
                    onClick={() =>
                      invoke('reveal_soul_in_finder', { soulName: selectedSoulInRepo.name })
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm font-medium btn-press"
                    aria-label={`Reveal ${selectedSoulInRepo.name} in Finder`}
                  >
                    <FolderOpen className="w-4 h-4" aria-hidden="true" />
                    Reveal
                  </button>
                )}
                {selectedSoulInRepo.isInstalled ? (
                  <button
                    onClick={() => handleUninstallSoul(selectedSoulInRepo)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm btn-press"
                    aria-label={`Uninstall ${selectedSoulInRepo.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallSoul(selectedSoulInRepo)}
                    disabled={installing === selectedSoulInRepo.id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm btn-press"
                    aria-label={`Install ${selectedSoulInRepo.name}`}
                  >
                    <PackagePlus className="w-4 h-4" aria-hidden="true" />
                    {installing === selectedSoulInRepo.id ? 'Installing...' : 'Install'}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleFetchRepo}
                disabled={fetching}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm btn-press"
                aria-label={`Fetch souls from ${displayRepo}`}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                {fetching ? 'Fetching...' : 'Fetch Souls'}
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="flex-1 truncate">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs underline whitespace-nowrap btn-press"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize="30%" minSize="15%" maxSize="50%">
              {/* Souls List */}
              <div className="h-full overflow-y-auto flex flex-col border-r border-[var(--border)]">
                <div className="p-3 border-b border-[var(--border)]">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">Contents</h3>
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                  {/* README row */}
                  <div
                    onClick={() => {
                      setSelectedSoulInRepo(null)
                      setViewMode('readme')
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                      viewMode === 'readme'
                        ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 ${viewMode === 'readme' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                      />
                      <span
                        className={`font-medium text-sm ${
                          viewMode === 'readme'
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        README
                      </span>
                    </div>
                  </div>

                  {/* Souls section */}
                  {(repo.isFetched || localFetched) && repoSouls.length > 0 ? (
                    <>
                      {/* Divider */}
                      <div className="px-3 py-2">
                        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">
                          Souls ({repoSouls.length})
                        </span>
                      </div>

                      {repoSouls.map((soul) => {
                        const isFavorite = isSoulFavorite(soul.id)
                        return (
                          <div
                            key={soul.id}
                            onClick={() => {
                              setSelectedSoulInRepo(soul)
                              setViewMode('soul')
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              setContextMenu({ x: e.clientX, y: e.clientY, soulId: soul.id })
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                              selectedSoulInRepo?.id === soul.id
                                ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                                : 'hover:bg-[var(--bg-tertiary)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isFavorite && (
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`font-medium text-sm ${
                                      selectedSoulInRepo?.id === soul.id
                                        ? 'text-[var(--accent)]'
                                        : 'text-[var(--text-primary)]'
                                    }`}
                                  >
                                    {soul.name}
                                  </span>
                                  {soul.isInstalled && (
                                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                  {soul.description}
                                </p>
                              </div>
                              {soul.isInstalled ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUninstallSoul(soul)
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                  title="Uninstall"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleInstallSoul(soul)
                                  }}
                                  disabled={installing === soul.id}
                                  className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors disabled:opacity-50"
                                  title="Install"
                                >
                                  <PackagePlus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : !(repo.isFetched || localFetched) ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-[var(--text-muted)]">
                        Fetch souls to view and install them
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>
            <Separator className="w-1.5 bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-col-resize flex items-center justify-center group">
              <GripVertical className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Separator>
            <Panel defaultSize="70%" minSize="40%">
              {/* Content Pane - README or Soul */}
              <div className="h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)] font-medium">
                    {viewMode === 'soul' && selectedSoulInRepo ? selectedSoulInRepo.name : 'README'}
                  </span>
                  {loadingReadme && (
                    <span className="text-xs text-[var(--text-muted)] ml-auto">Loading...</span>
                  )}
                  {!(repo.isFetched || localFetched) && (
                    <span className="text-xs bg-amber-500/15 text-amber-500 px-2.5 py-0.5 rounded-full ml-auto font-medium">
                      Fetch souls to view and install
                    </span>
                  )}
                  {viewMode === 'soul' && selectedSoulInRepo?.isInstalled && (
                    <button
                      onClick={() =>
                        invoke('reveal_soul_in_finder', { soulName: selectedSoulInRepo.name })
                      }
                      className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-md transition-colors"
                      title="Reveal in Finder"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Reveal
                    </button>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {viewMode === 'soul' && selectedSoulInRepo?.content ? (
                    <MarkdownPreview
                      source={selectedSoulInRepo.content}
                      style={{ backgroundColor: 'transparent' }}
                      wrapperElement={{ 'data-color-mode': 'dark' }}
                    />
                  ) : repoReadme ? (
                    <MarkdownPreview
                      source={repoReadme}
                      style={{ backgroundColor: 'transparent' }}
                      wrapperElement={{ 'data-color-mode': 'dark' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                      {loadingReadme ? 'Loading README...' : 'No README found'}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </Group>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            role="menu"
            className="fixed bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              role="menuitem"
              onClick={() => {
                onToggleSoulFavorite(contextMenu.soulId)
                setContextMenu(null)
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 text-[var(--text-primary)]"
            >
              <Star
                className={`w-4 h-4 ${isSoulFavorite(contextMenu.soulId) ? 'text-amber-500 fill-amber-500' : 'text-[var(--text-muted)]'}`}
              />
              {isSoulFavorite(contextMenu.soulId) ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Soul view
  const soul = selection.soul
  const displaySoulRepo = toSoulDisplayRepo(soul.owner, soul.repo)
  const githubUrl = `https://github.com/${soul.owner}/${soul.repo}`
  const soulFolderPath =
    soul.soulsPath === '.' ? soul.path : `${soul.soulsPath.replace(/\/$/, '')}/${soul.path}`
  const soulFolderUrl = `${githubUrl}/tree/main/${soulFolderPath}`

  const handleFetch = async () => {
    setFetching(true)
    setError(null)
    try {
      await invoke('fetch_repo', { owner: soul.owner, repo: soul.repo })
      onRefresh()
      toast.success(`Fetched souls from ${displaySoulRepo}`)
    } catch (e) {
      setError(String(e))
      toast.error('Failed to fetch repository')
    } finally {
      setFetching(false)
    }
  }

  const handleInstall = async () => {
    setInstalling(soul.id)
    setError(null)
    try {
      await invoke('install_soul', {
        owner: soul.owner,
        repo: soul.repo,
        soulName: soul.name,
        soulPath: soul.path,
        soulsPath: soul.soulsPath,
        method: installMethod,
      })
      onRefresh()
      toast.success(`Installed "${soul.name}"`)
    } catch (e) {
      setError(String(e))
      toast.error(`Failed to install "${soul.name}"`)
    } finally {
      setInstalling(null)
    }
  }

  const handleUninstall = async () => {
    const confirmed = await confirm(`Uninstall "${soul.name}"?`, {
      title: 'Uninstall Soul',
      kind: 'warning',
      okLabel: 'Uninstall',
      cancelLabel: 'Cancel',
    })
    if (!confirmed) return

    setError(null)
    try {
      await invoke('uninstall_soul', { soulName: soul.name })
      onRefresh()
      toast.success(`Uninstalled "${soul.name}"`)
    } catch (e) {
      setError(String(e))
      toast.error(`Failed to uninstall "${soul.name}"`)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FileText className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">{soul.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">{displaySoulRepo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors btn-press"
            aria-label={`Open ${soul.name} on GitHub`}
          >
            <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
          </a>

          {!soul.isFetched && (
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm btn-press"
              aria-label={`Fetch ${soul.name} from GitHub`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              {fetching ? 'Fetching...' : 'Fetch'}
            </button>
          )}

          {soul.isFetched && !soul.isInstalled && (
            <button
              onClick={handleInstall}
              disabled={installing === soul.id}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm btn-press"
              aria-label={`Install ${soul.name}`}
            >
              <PackagePlus className="w-4 h-4" aria-hidden="true" />
              {installing === soul.id ? 'Installing...' : 'Install'}
            </button>
          )}

          {soul.isInstalled && (
            <>
              <button
                onClick={() => invoke('reveal_soul_in_finder', { soulName: soul.name })}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm font-medium btn-press"
                aria-label={`Reveal ${soul.name} in Finder`}
              >
                <FolderOpen className="w-4 h-4" aria-hidden="true" />
                Reveal
              </button>
              <button
                onClick={handleUninstall}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm btn-press"
                aria-label={`Uninstall ${soul.name}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Uninstall
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span className="flex-1 truncate">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs underline whitespace-nowrap btn-press"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {soul.isFetched && soul.content ? (
          <div className="h-full overflow-y-auto p-6">
            <MarkdownPreview
              source={soul.content}
              style={{ backgroundColor: 'transparent' }}
              wrapperElement={{ 'data-color-mode': 'dark' }}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* GitHub Preview Header */}
            <div className="px-4 py-2.5 bg-[var(--bg-tertiary)] border-b border-[var(--border)] flex items-center gap-2">
              <Github className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)] font-medium">
                GitHub Preview
              </span>
              {!soul.isFetched && (
                <span className="text-xs bg-amber-500/15 text-amber-500 px-2.5 py-0.5 rounded-full ml-auto font-medium">
                  Not fetched
                </span>
              )}
            </div>
            {/* Iframe for GitHub */}
            <iframe
              src={soulFolderUrl}
              className="flex-1 w-full border-0 bg-white"
              title="GitHub Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  )
}
