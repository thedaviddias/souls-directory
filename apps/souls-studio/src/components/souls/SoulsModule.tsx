import { GripVertical } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { toast } from 'sonner'
import { useSettings } from '../../hooks/useSettings'
import { useSoulAuth } from '../../hooks/useSoulAuth'
import { useSoulsSync } from '../../hooks/useSoulsSync'
import { identifyUser, trackEvent } from '../../lib/analytics'
import { getConfiguredConvexUrl } from '../../lib/convex-config'
import { signInExternal } from '../../lib/tauri-auth'
import type { CommunitySoulImportRequest } from '../../types/community-draft'
import { SoulsDetail } from './SoulsDetail'
import { SoulsSidebar } from './SoulsSidebar'
import { SoulsSyncStatus } from './SoulsSyncStatus'

function SoulsModuleContent({
  user,
  isAuthenticated,
  onSignIn,
  onSignOut,
  importRequest,
  onImportConsumed,
}: {
  user: {
    _id: string
    handle?: string | null
    githubHandle?: string | null
    displayName?: string | null
    name?: string | null
  } | null
  isAuthenticated: boolean
  onSignIn: () => void
  onSignOut: () => Promise<void>
  importRequest?: CommunitySoulImportRequest | null
  onImportConsumed?: (requestId: number) => void
}) {
  const { settings } = useSettings()
  const ownerHandle = user?.handle ?? user?.githubHandle ?? user?.name ?? 'local'
  const { souls, loading, status, createSoul, updateSoulLocal, saveSoul, deleteSoul, syncNow } =
    useSoulsSync({
      userId: user?._id ?? 'local',
      defaultOwnerHandle: ownerHandle,
      isAuthenticated,
    })
  const [selectedSoulId, setSelectedSoulId] = useState<string | null>(null)
  const [lastImportedRequestId, setLastImportedRequestId] = useState<number | null>(null)

  useEffect(() => {
    if (souls.length === 0) {
      setSelectedSoulId(null)
      return
    }

    if (!selectedSoulId || !souls.some((soul) => soul.localId === selectedSoulId)) {
      setSelectedSoulId(souls[0].localId)
    }
  }, [selectedSoulId, souls])

  const selectedSoul = useMemo(
    () => souls.find((soul) => soul.localId === selectedSoulId) ?? null,
    [selectedSoulId, souls]
  )

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCreateSoul = () => {
    const createdSoulId = createSoul()
    setSelectedSoulId(createdSoulId)
    trackEvent('soul_created', { source: 'sidebar' })
  }

  const handleSaveSoul = useCallback(
    (localSoulId: string) => {
      saveSoul(localSoulId)
      setLastSavedAt(Date.now())
      trackEvent('soul_saved')
    },
    [saveSoul]
  )

  // Autosave: queue a sync op 2s after the last local change
  useEffect(() => {
    if (!selectedSoul || selectedSoul.syncState !== 'pending') return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

    autosaveTimerRef.current = setTimeout(() => {
      saveSoul(selectedSoul.localId)
      setLastSavedAt(Date.now())
    }, 2000)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [selectedSoul?.localUpdatedAt, selectedSoul?.localId, selectedSoul?.syncState, saveSoul])

  const handleDeleteSoul = (localSoulId: string) => {
    deleteSoul(localSoulId)
    if (selectedSoulId === localSoulId) {
      setSelectedSoulId(null)
    }
    toast.success('Soul deleted')
    trackEvent('soul_deleted')
  }

  const handlePublishNow = (localSoulId: string) => {
    saveSoul(localSoulId)
    void syncNow()
    toast.success('Saved and syncing')
    trackEvent('soul_published')
  }

  useEffect(() => {
    if (!importRequest || lastImportedRequestId === importRequest.requestId) {
      return
    }

    const localSoulId = createSoul()
    updateSoulLocal(localSoulId, {
      name: importRequest.draft.name,
      slug: importRequest.draft.slug.toLowerCase(),
      tagline: importRequest.draft.tagline,
      description: importRequest.draft.description,
      content: importRequest.draft.content,
    })
    setSelectedSoulId(localSoulId)
    setLastImportedRequestId(importRequest.requestId)

    // Defer parent state update to avoid "setState while rendering" warning
    const requestId = importRequest.requestId
    queueMicrotask(() => onImportConsumed?.(requestId))
  }, [createSoul, importRequest, lastImportedRequestId, onImportConsumed, updateSoulLocal])

  const userLabel = user?.displayName ?? user?.handle ?? user?.githubHandle ?? user?.name ?? 'Local'

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
        <div className="h-10 border-b border-[var(--border)] animate-pulse bg-[var(--bg-tertiary)]" />
        <div className="flex-1 flex">
          <div className="w-64 border-r border-[var(--border)] p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-2 px-3 py-2">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-[var(--bg-tertiary)] rounded w-3/4" />
                  <div className="h-2.5 bg-[var(--bg-tertiary)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-[var(--bg-tertiary)] rounded w-1/3" />
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/4" />
            <div className="h-32 bg-[var(--bg-tertiary)] rounded w-full mt-4" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <SoulsSyncStatus
        status={status}
        isAuthenticated={isAuthenticated}
        onSyncNow={() => void syncNow()}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        userLabel={userLabel}
      />
      <div className="flex-1 min-h-0">
        <Group orientation="horizontal" className="h-full">
          <Panel defaultSize="30%" minSize="15%" maxSize="50%">
            <SoulsSidebar
              souls={souls}
              selectedSoulId={selectedSoulId}
              onSelectSoul={setSelectedSoulId}
              onCreateSoul={handleCreateSoul}
            />
          </Panel>
          <Separator className="w-1.5 bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-col-resize flex items-center justify-center group">
            <GripVertical className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Separator>
          <Panel defaultSize="70%" minSize="40%">
            <SoulsDetail
              soul={selectedSoul}
              syncing={status.state === 'syncing'}
              editorFontSize={settings.editorFontSize}
              lastSavedAt={lastSavedAt}
              onChange={updateSoulLocal}
              onSave={handleSaveSoul}
              onPublishNow={handlePublishNow}
              onDelete={handleDeleteSoul}
            />
          </Panel>
        </Group>
      </div>
    </div>
  )
}

export function SoulsModule({
  importRequest,
  onImportConsumed,
}: {
  importRequest?: CommunitySoulImportRequest | null
  onImportConsumed?: (requestId: number) => void
}) {
  const convexUrlConfigured = Boolean(getConfiguredConvexUrl())
  const { me, isAuthenticated, signIn, signOut } = useSoulAuth(convexUrlConfigured)

  const handleSignIn = () => {
    void signInExternal(signIn, 'github')
    trackEvent('sign_in_started', { provider: 'github' })
  }

  // Identify user for analytics when authenticated
  useEffect(() => {
    if (isAuthenticated && me) {
      identifyUser(me._id, {
        handle: me.handle ?? me.githubHandle,
        displayName: me.displayName ?? me.name,
      })
    }
  }, [isAuthenticated, me])

  return (
    <SoulsModuleContent
      user={isAuthenticated && me ? me : null}
      isAuthenticated={isAuthenticated}
      onSignIn={handleSignIn}
      onSignOut={signOut}
      importRequest={importRequest}
      onImportConsumed={onImportConsumed}
    />
  )
}
