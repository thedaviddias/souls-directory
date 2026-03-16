import * as Sentry from '@sentry/react'
import { attachConsole, error as logError, info as logInfo } from '@tauri-apps/plugin-log'
import { isTauriRuntime } from './tauri'

let desktopConsoleAttached = false
let sentryInitialized = false

function getFloatEnv(name: string, fallback: number) {
  const raw = import.meta.env[name]
  if (typeof raw !== 'string' || raw.trim() === '') return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function initFrontendSentry() {
  if (sentryInitialized) return

  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: getFloatEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', 0),
  })

  sentryInitialized = true
}

export async function initDesktopLogging() {
  if (desktopConsoleAttached || !isTauriRuntime()) return

  try {
    await attachConsole()
    desktopConsoleAttached = true
    await logInfo('Desktop log bridge attached')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('Failed to attach desktop log bridge:', message)
    await logError(`Failed to attach desktop log bridge: ${message}`).catch(() => undefined)
  }
}
