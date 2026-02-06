/**
 * Sentry edge runtime configuration for souls.directory
 *
 * This file configures Sentry for the Edge runtime.
 * It runs in edge functions and middleware.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs'
import { edgeSentryOptions } from './lib/sentry'

Sentry.init({
  ...edgeSentryOptions,

  // Edge runtime has limited APIs
  // Keep configuration minimal
})
