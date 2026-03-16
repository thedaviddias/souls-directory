import { useCallback, useEffect, useState } from 'react'
import { isTauriRuntime } from '../lib/tauri'

interface UpdateInfo {
  available: boolean
  version: string | null
  body: string | null
}

const DISMISSED_KEY = 'souls-studio-dismissed-update'

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    version: null,
    body: null,
  })
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const checkForUpdate = useCallback(async (silent = false) => {
    if (!isTauriRuntime()) return
    setChecking(true)
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (update?.available) {
        const dismissedVersion = localStorage.getItem(DISMISSED_KEY)
        setUpdateInfo({
          available: true,
          version: update.version,
          body: update.body ?? null,
        })
        setDismissed(dismissedVersion === update.version)
      } else if (!silent) {
        const { toast } = await import('sonner')
        toast.success("You're up to date!")
      }
    } catch (error) {
      if (!silent) {
        console.error('Update check failed:', error)
      }
    } finally {
      setChecking(false)
    }
  }, [])

  const downloadAndInstall = useCallback(async () => {
    if (!isTauriRuntime()) return
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const { relaunch } = await import('@tauri-apps/plugin-process')
      const update = await check()
      if (!update?.available) return

      let downloaded = 0
      let totalLength = 0
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            totalLength = event.data.contentLength ?? 0
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            if (totalLength > 0) {
              setDownloadProgress(Math.round((downloaded / totalLength) * 100))
            }
            break
          case 'Finished':
            setDownloadProgress(100)
            break
        }
      })

      localStorage.removeItem(DISMISSED_KEY)
      await relaunch()
    } catch (error) {
      console.error('Update install failed:', error)
      const { toast } = await import('sonner')
      toast.error('Failed to install update')
    } finally {
      setDownloading(false)
    }
  }, [])

  const dismissUpdate = useCallback(() => {
    setDismissed(true)
    if (updateInfo.version) {
      localStorage.setItem(DISMISSED_KEY, updateInfo.version)
    }
  }, [updateInfo.version])

  // Silent check on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkForUpdate(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [checkForUpdate])

  return {
    updateAvailable: updateInfo.available,
    updateVersion: updateInfo.version,
    updateBody: updateInfo.body,
    checking,
    downloading,
    downloadProgress,
    dismissed,
    checkForUpdate: () => checkForUpdate(false),
    downloadAndInstall,
    dismissUpdate,
  }
}
