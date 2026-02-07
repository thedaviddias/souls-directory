import type { BrowserOptions, NodeOptions } from '@sentry/nextjs'

/**
 * Centralized Sentry configuration for souls.directory
 *
 * Optimized for free tier (5K errors/month, 10K transactions/month):
 * - Low sample rates to preserve quota
 * - Aggressive error filtering to ignore noise
 * - Minimal breadcrumbs to reduce payload size
 * - No replays or profiling (uses significant quota)
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
// Set SENTRY_ENABLED_FOR_TEST=1 in .env.local to send events from dev (e.g. to verify the test route); remove after testing
const sentryEnabledForTest = process.env.SENTRY_ENABLED_FOR_TEST === '1'

/**
 * Common errors that are safe to ignore (browser quirks, network issues, user cancellations)
 */
export const IGNORED_ERRORS: (string | RegExp)[] = [
  // Browser quirks
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',

  // Network errors (user's network issues, not our bugs)
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'NetworkError',
  'net::ERR_',
  /^Loading chunk \d+ failed/,
  'ChunkLoadError',

  // User-initiated cancellations
  'AbortError',
  'The operation was aborted',
  'The user aborted a request',

  // Third-party script errors
  'Script error.',
  'Script error',

  // WebSocket errors (Convex reconnections are handled internally)
  'WebSocket connection failed',

  // Safari-specific
  'cancelled',

  // React hydration (usually caused by browser extensions)
  /Hydration failed because the server rendered HTML didn't match the client/,
  /There was an error while hydrating/,
  /Minified React error #\d+/,
]

/**
 * URLs to ignore errors from (browser extensions, third-party scripts)
 */
export const DENY_URLS: (string | RegExp)[] = [
  // Browser extensions
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  /^safari-extension:\/\//,
  /^safari-web-extension:\/\//,

  // Google services
  /googletagmanager\.com/,
  /google-analytics\.com/,

  // Other analytics
  /plausible\.io/,
  /analytics\./,

  // Browser internals
  /^webkit-masked-url:\/\//,
]

/**
 * Shared Sentry configuration options
 * Used by client, server, and edge configs
 */
export const sharedSentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Production + DSN, or dev with SENTRY_ENABLED_FOR_TEST=1 (for one-off local testing)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && (isProduction || sentryEnabledForTest),

  // Environment tag: use Vercel's names so events show under vercel-production / vercel-preview in Sentry
  environment:
    process.env.VERCEL_ENV === 'production'
      ? 'vercel-production'
      : process.env.VERCEL_ENV === 'preview'
        ? 'vercel-preview'
        : process.env.NODE_ENV || 'development',

  // Release tracking (auto-populated by Vercel if available)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // ============================================
  // FREE TIER OPTIMIZATION
  // ============================================

  // When testing from dev, send 100% so the test route always reaches Sentry; otherwise 25%
  sampleRate: sentryEnabledForTest ? 1 : 0.25,

  // Sample only 1% of transactions for performance monitoring (10K/month limit)
  tracesSampleRate: 0.01,

  // Reduce breadcrumbs from 100 (default) to 20 for smaller payloads
  maxBreadcrumbs: 20,

  // Don't attach stack traces to non-error events (saves payload size)
  attachStacktrace: false,

  // Disable structured logs (uses quota)
  enableLogs: false,

  // ============================================
  // ERROR FILTERING
  // ============================================

  ignoreErrors: IGNORED_ERRORS,
  denyUrls: DENY_URLS,

  /**
   * Filter errors before sending to Sentry
   * Return null to drop the event
   */
  beforeSend(event, hint) {
    const error = hint?.originalException

    // Don't send errors in development (unless SENTRY_ENABLED_FOR_TEST=1 for one-off verification)
    if (isDevelopment && !sentryEnabledForTest) {
      return null
    }

    // Filter out errors from browser extensions
    if (event.exception?.values) {
      const isExtensionError = event.exception.values.some((exception) => {
        const frames = exception.stacktrace?.frames || []
        return frames.some(
          (frame) =>
            frame.filename?.includes('chrome-extension://') ||
            frame.filename?.includes('moz-extension://') ||
            frame.filename?.includes('safari-extension://')
        )
      })

      if (isExtensionError) {
        return null
      }
    }

    // Filter errors with no useful stack trace
    if (error instanceof Error && (!error.stack || error.stack === 'Error') && !error.message) {
      return null
    }

    return event
  },

  /**
   * Filter breadcrumbs to reduce noise
   */
  beforeBreadcrumb(breadcrumb) {
    // Skip noisy console breadcrumbs in development
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null
    }

    // Skip fetch breadcrumbs for analytics endpoints
    if (breadcrumb.category === 'fetch') {
      const url = breadcrumb.data?.url || ''
      if (
        url.includes('plausible.io') ||
        url.includes('google-analytics.com') ||
        url.includes('googletagmanager.com')
      ) {
        return null
      }
    }

    return breadcrumb
  },
} satisfies Partial<BrowserOptions & NodeOptions>

/**
 * Client-specific options (browser)
 */
export const clientSentryOptions: BrowserOptions = {
  ...sharedSentryOptions,

  // Configure which URLs receive trace headers for distributed tracing
  tracePropagationTargets: [
    'localhost',
    // Convex API
    /^https:\/\/.*\.convex\.cloud/,
    // Our own API routes
    /^https:\/\/souls\.directory\/api/,
    /^https:\/\/.*\.vercel\.app\/api/,
  ],

  // ============================================
  // DISABLED FEATURES (cost optimization)
  // ============================================

  // Replays use significant quota - disabled for free tier
  // If you want replays, use: replaysSessionSampleRate: 0.01, replaysOnErrorSampleRate: 0.1

  // Profiling uses quota - disabled
  // If you want profiling, use: profilesSampleRate: 0.01
}

/**
 * Server-specific options (Node.js runtime)
 */
export const serverSentryOptions: NodeOptions = {
  ...sharedSentryOptions,

  // Server-side specific settings can go here
  // For example, you might want different sample rates for server errors
}

/**
 * Edge-specific options (Edge runtime)
 */
export const edgeSentryOptions: NodeOptions = {
  ...sharedSentryOptions,

  // Edge runtime has limited APIs, keep config minimal
  // Breadcrumbs may be limited in edge runtime
  maxBreadcrumbs: 10,
}
