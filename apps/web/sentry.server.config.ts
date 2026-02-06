/**
 * Sentry server-side configuration for souls.directory
 *
 * This file configures Sentry for the Node.js server runtime.
 * It runs during SSR and API routes.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'
import { serverSentryOptions } from './lib/sentry'

Sentry.init({
  ...serverSentryOptions,

  // Server-side specific integrations
  integrations: [
    // Add any server-specific integrations here
    // For example, if using a database:
    // Sentry.prismaIntegration(),
  ],

  // ============================================
  // PROFILING - Disabled for free tier
  // ============================================
  // Uncomment to enable profiling (uses quota):
  //
  // profilesSampleRate: 0.01, // 1% of transactions
})
