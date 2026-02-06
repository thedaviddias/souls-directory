import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'forks',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.config.ts',
        'vitest.setup.ts',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
      ],
      thresholds: {
        statements: 40,
        branches: 35,
        functions: 40,
        lines: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
      // Stub external dependencies that may not be installed
      'canvas-confetti': new URL('./vitest.stubs.ts', import.meta.url).pathname,
      // Stub Convex modules for tests
      '@convex-dev/auth/react': new URL('./__mocks__/convex-auth-react.ts', import.meta.url)
        .pathname,
      'convex/react': new URL('./__mocks__/convex-react.ts', import.meta.url).pathname,
    },
  },
})
