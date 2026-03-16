import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const plugins = [react()]

  const sentryOrg = process.env.SENTRY_ORG
  const sentryProject = process.env.SENTRY_PROJECT
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

  if (mode === 'production' && sentryOrg && sentryProject && sentryAuthToken) {
    plugins.push(
      sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        release: {
          name: process.env.SENTRY_RELEASE || process.env.npm_package_version,
        },
      })
    )
  }

  return {
    plugins,
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
  }
})
