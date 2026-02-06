/**
 * Feature flags for souls.directory.
 * Toggle in development via the Vercel Toolbar (Flags Explorer).
 * @see https://vercel.com/docs/feature-flags
 */

import { flag } from 'flags/next'

export const collectionsEnabled = flag<boolean>({
  key: 'collections-enabled',
  defaultValue: false,
  description: 'Show Collections feature (nav, dashboard, soul detail Add to collection)',
  options: [
    { value: true, label: 'On' },
    { value: false, label: 'Off' },
  ],
  decide() {
    return false
  },
})
