import { Search, Settings as SettingsIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { CommandPalette } from './components/CommandPalette'
import { GatewayStatusIndicator } from './components/GatewayStatusIndicator'
import { Onboarding } from './components/Onboarding'
import { Settings, type SettingsPage } from './components/Settings'
import { UpdateBanner } from './components/UpdateBanner'
import { UserAvatar } from './components/UserAvatar'
import { WhatsNew } from './components/WhatsNew'
import { AgentsModule } from './components/agents/AgentsModule'
import { CommunitySoulsModule } from './components/souls/CommunitySoulsModule'
import { SoulsModule } from './components/souls/SoulsModule'
import { GatewayProvider } from './contexts/GatewayContext'
import { useAppUpdate } from './hooks/useAppUpdate'
import { useOnboarding } from './hooks/useOnboarding'
import { useSoulAuth } from './hooks/useSoulAuth'
import { trackEvent } from './lib/analytics'
import { setupDeepLinkAuthHandler } from './lib/auth-callback'
import { getConfiguredConvexUrl } from './lib/convex-config'
import { isTauriRuntime, openExternalUrl } from './lib/tauri'
import { signInExternal } from './lib/tauri-auth'
import { markWhatsNewSeen, shouldShowWhatsNew } from './lib/whats-new'
import type { CommunitySoulDraft, CommunitySoulImportRequest } from './types/community-draft'

type ActiveModule = 'library' | 'agents' | 'souls'

const tabTransform: Record<ActiveModule, string> = {
  library: 'translateX(0)',
  agents: 'translateX(100%)',
  souls: 'translateX(200%)',
}

const tabLabels: Record<ActiveModule, string> = {
  library: 'Explore',
  agents: 'AI Agents',
  souls: 'My Souls',
}

function App() {
  const { completed: onboardingCompleted, markCompleted: markOnboardingCompleted } = useOnboarding()
  const convexUrlConfigured = Boolean(getConfiguredConvexUrl())
  const { signIn } = useSoulAuth(convexUrlConfigured)
  const [activeModule, setActiveModule] = useState<ActiveModule>('library')
  const [importRequest, setImportRequest] = useState<CommunitySoulImportRequest | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsPage, setSettingsPage] = useState<SettingsPage | undefined>(undefined)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const update = useAppUpdate()

  // Auto-show What's New after app update
  useEffect(() => {
    if (onboardingCompleted && shouldShowWhatsNew()) {
      setShowWhatsNew(true)
      markWhatsNewSeen()
    }
  }, [onboardingCompleted])

  // Listen for OAuth deep-link callbacks (souls-studio://auth-callback?code=...)
  useEffect(() => {
    void setupDeepLinkAuthHandler(signIn)
  }, [signIn])

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<CommunitySoulDraft>
      if (!customEvent.detail) {
        return
      }

      setImportRequest({
        requestId: Date.now(),
        draft: customEvent.detail,
      })
      setActiveModule('souls')
    }

    window.addEventListener('souls-studio:open-in-my-souls', handler as EventListener)
    return () =>
      window.removeEventListener('souls-studio:open-in-my-souls', handler as EventListener)
  }, [])

  // Global keyboard shortcuts (Cmd+1, Cmd+2, Cmd+3, Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') {
          e.preventDefault()
          switchModule('library')
        } else if (e.key === '2') {
          e.preventDefault()
          switchModule('agents')
        } else if (e.key === '3') {
          e.preventDefault()
          switchModule('souls')
        } else if (e.key === 'n') {
          e.preventDefault()
          handleCreateSoul()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const switchModule = useCallback((module: ActiveModule) => {
    setActiveModule(module)
    trackEvent('tab_switched', { tab: module })
  }, [])

  const handleCreateSoul = useCallback(() => {
    const draft: CommunitySoulDraft = {
      name: 'Untitled Soul',
      slug: `new-soul-${Date.now()}`,
      tagline: '',
      description: '',
      content: '# SOUL.md\n\nWrite your soul here.',
    }
    setImportRequest({ requestId: Date.now(), draft })
    setActiveModule('souls')
    trackEvent('soul_created', { source: 'shortcut' })
  }, [])

  const handleRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('souls-studio:refresh'))
  }, [])

  const handleOpenSettings = useCallback((page?: SettingsPage) => {
    setSettingsPage(page)
    setShowSettings(true)
  }, [])

  // Listen for open-settings event from gateway popover
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SettingsPage>).detail
      handleOpenSettings(detail || undefined)
    }
    window.addEventListener('souls-studio:open-settings', handler)
    return () => window.removeEventListener('souls-studio:open-settings', handler)
  }, [handleOpenSettings])

  // Listen for native menu events from Tauri
  useEffect(() => {
    if (!isTauriRuntime()) return
    let cleanup: (() => void) | undefined
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<string>('menu-event', (event) => {
        switch (event.payload) {
          case 'menu://settings':
            handleOpenSettings()
            break
          case 'menu://new-soul':
            handleCreateSoul()
            break
          case 'menu://tab-library':
            switchModule('library')
            break
          case 'menu://tab-agents':
            switchModule('agents')
            break
          case 'menu://tab-souls':
            switchModule('souls')
            break
          case 'menu://check-update':
            void update.checkForUpdate()
            break
          case 'menu://whats-new':
            setShowWhatsNew(true)
            break
          case 'menu://open-docs':
            void openExternalUrl('https://souls.directory')
            break
        }
      }).then((unlisten) => {
        cleanup = unlisten
      })
    })
    return () => {
      cleanup?.()
    }
  }, [handleOpenSettings, handleCreateSoul, switchModule, update])

  // Show nothing while onboarding state loads, then onboarding if not completed
  if (onboardingCompleted === null) {
    return <div className="h-screen bg-[var(--bg-primary)]" />
  }

  if (!onboardingCompleted) {
    return (
      <Onboarding
        onComplete={markOnboardingCompleted}
        onSignIn={() => {
          void signInExternal(signIn, 'github')
          markOnboardingCompleted()
        }}
      />
    )
  }

  return (
    <GatewayProvider>
      <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
        <CommandPalette
          onSwitchToModule={switchModule}
          onCreateSoul={handleCreateSoul}
          onOpenSettings={handleOpenSettings}
          onRefresh={handleRefresh}
          onWhatsNew={() => setShowWhatsNew(true)}
          onCheckUpdate={update.checkForUpdate}
        />

        {/* macOS-style titlebar with traffic light inset */}
        <div
          className="titlebar relative border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 flex items-center justify-center"
          role="banner"
        >
          <nav className="segmented-control" role="tablist" aria-label="Main navigation">
            <div
              className="segmented-control-indicator"
              style={{ transform: tabTransform[activeModule] }}
            />
            {(['library', 'agents', 'souls'] as ActiveModule[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeModule === tab}
                aria-controls={`panel-${tab}`}
                onClick={() => switchModule(tab)}
                className={`segmented-control-item ${activeModule === tab ? 'active' : ''}`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </nav>
          <div className="absolute left-[var(--titlebar-inset)] flex items-center">
            <GatewayStatusIndicator />
          </div>
          <div className="absolute right-4 flex items-center gap-2">
            <UserAvatar />
            <button
              onClick={() => handleOpenSettings()}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors btn-press"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('souls-studio:open-command-palette'))
              }
              className="flex items-center gap-1.5 px-2 py-1 text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md hover:bg-[var(--border)] transition-colors btn-press"
              aria-label="Open command palette"
            >
              <Search className="w-3 h-3" aria-hidden="true" />
              <kbd className="text-[10px]">⌘K</kbd>
            </button>
          </div>
        </div>

        {update.updateAvailable && !update.dismissed && (
          <UpdateBanner
            version={update.updateVersion!}
            downloading={update.downloading}
            downloadProgress={update.downloadProgress}
            onUpdate={update.downloadAndInstall}
            onWhatsNew={() => setShowWhatsNew(true)}
            onDismiss={update.dismissUpdate}
          />
        )}

        {/* Screen reader live region for tab changes */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          Viewing {tabLabels[activeModule]} tab
        </div>

        <div className="flex-1 min-h-0">
          <div
            id="panel-library"
            role="tabpanel"
            className={activeModule === 'library' ? 'h-full animate-fade-in' : 'hidden'}
            aria-hidden={activeModule !== 'library'}
          >
            <CommunitySoulsModule />
          </div>
          {activeModule === 'souls' && (
            <div id="panel-souls" role="tabpanel" className="h-full animate-fade-in">
              <SoulsModule
                importRequest={importRequest}
                onImportConsumed={(requestId) => {
                  setImportRequest((current) => (current?.requestId === requestId ? null : current))
                }}
              />
            </div>
          )}
          {activeModule === 'agents' && (
            <div id="panel-agents" role="tabpanel" className="h-full animate-fade-in">
              <AgentsModule />
            </div>
          )}
        </div>
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} initialPage={settingsPage} />
        )}
        {showWhatsNew && <WhatsNew onClose={() => setShowWhatsNew(false)} />}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </div>
    </GatewayProvider>
  )
}

export default App
