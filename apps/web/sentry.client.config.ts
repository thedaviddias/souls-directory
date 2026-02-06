/**
 * Sentry client-side configuration for souls.directory
 *
 * This file configures Sentry for the browser (client) runtime.
 * It runs when the app loads in the user's browser.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'
import { clientSentryOptions } from './lib/sentry'

Sentry.init({
  ...clientSentryOptions,

  integrations: [
    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration({
      // Don't create spans for every request (saves quota)
      enableInp: true,
    }),
  ],

  // ============================================
  // REPLAYS - Disabled for free tier
  // ============================================
  // Uncomment to enable session replays (uses significant quota):
  //
  // integrations: [
  //   Sentry.browserTracingIntegration(),
  //   Sentry.replayIntegration({
  //     maskAllText: true,
  //     blockAllMedia: true,
  //   }),
  // ],
  // replaysSessionSampleRate: 0.01, // 1% of sessions
  // replaysOnErrorSampleRate: 0.1,  // 10% of sessions with errors
})
