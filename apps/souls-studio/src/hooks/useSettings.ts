import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'
import type { InstallMethod, OpenClawConnection, Settings, ThemeMode } from '../types/soul'

const STORAGE_KEY = 'souls-studio-settings'

const defaultSettings: Settings = {
  installMethod: 'copy',
  theme: 'system',
  editorFontSize: 13,
  syncIntervalSeconds: 30,
  openclawConnections: [],
}

// Shared state so all useSettings() callers see the same data
let sharedSettings: Settings = defaultSettings
const listeners = new Set<(s: Settings) => void>()
function notifyListeners(s: Settings) {
  sharedSettings = s
  listeners.forEach((fn) => fn(s))
}

let initialized = false

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(sharedSettings)
  const [loading, setLoading] = useState(!initialized)

  // Subscribe to shared state changes
  useEffect(() => {
    listeners.add(setSettings)
    return () => {
      listeners.delete(setSettings)
    }
  }, [])

  useEffect(() => {
    if (initialized) return
    initialized = true

    if (isTauriRuntime()) {
      invoke<Settings>('get_settings')
        .then((saved) => notifyListeners({ ...defaultSettings, ...saved }))
        .catch(() => notifyListeners(defaultSettings))
        .finally(() => setLoading(false))
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          notifyListeners({ ...defaultSettings, ...JSON.parse(stored) })
        }
      } catch {
        // ignore
      }
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const updated = { ...sharedSettings, ...newSettings }
    notifyListeners(updated)
    if (isTauriRuntime()) {
      await invoke('save_settings', { settings: updated })
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
    }
  }, [])

  const setInstallMethod = useCallback(
    (method: InstallMethod) => updateSettings({ installMethod: method }),
    [updateSettings]
  )

  // Apply theme to document root for CSS variable switching
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', settings.theme)
    }
  }, [settings.theme])

  const setTheme = useCallback((theme: ThemeMode) => updateSettings({ theme }), [updateSettings])

  const setEditorFontSize = useCallback(
    (editorFontSize: number) => updateSettings({ editorFontSize }),
    [updateSettings]
  )

  const setSyncInterval = useCallback(
    (syncIntervalSeconds: number) => updateSettings({ syncIntervalSeconds }),
    [updateSettings]
  )

  const addConnection = useCallback(
    (connection: OpenClawConnection) => {
      const connections = [...settings.openclawConnections, connection]
      return updateSettings({ openclawConnections: connections })
    },
    [settings.openclawConnections, updateSettings]
  )

  const updateConnection = useCallback(
    (id: string, patch: Partial<OpenClawConnection>) => {
      const connections = settings.openclawConnections.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      )
      return updateSettings({ openclawConnections: connections })
    },
    [settings.openclawConnections, updateSettings]
  )

  const removeConnection = useCallback(
    (id: string) => {
      const connections = settings.openclawConnections.filter((c) => c.id !== id)
      return updateSettings({ openclawConnections: connections })
    },
    [settings.openclawConnections, updateSettings]
  )

  return {
    settings,
    loading,
    setInstallMethod,
    setTheme,
    setEditorFontSize,
    setSyncInterval,
    addConnection,
    updateConnection,
    removeConnection,
    updateSettings,
  }
}
