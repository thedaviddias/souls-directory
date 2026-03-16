/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string
  readonly VITE_SOULS_SYNC_INTERVAL_MS?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
