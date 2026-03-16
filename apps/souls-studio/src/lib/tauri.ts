import { invoke as tauriInvoke } from '@tauri-apps/api/core'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

export function isTauriRuntime() {
  return typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__ !== 'undefined'
}

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error('Tauri runtime is not available. Open the desktop app, not the web preview.')
  }

  try {
    return await tauriInvoke<T>(command, args)
  } catch (error) {
    throw error
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener')
      await openUrl(url)
      return
    } catch {
      // Fall back to browser open below.
    }
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
