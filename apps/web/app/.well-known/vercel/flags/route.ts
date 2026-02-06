/**
 * Vercel Flags Discovery Endpoint
 *
 * Lets the Vercel Toolbar discover available flags (adds x-flags-sdk-version and verifyAccess when FLAGS_SECRET is set).
 * When FLAGS_SECRET is missing (e.g. local dev), returns flag definitions without auth so the toolbar still works.
 * @see https://flags-sdk.dev/api-reference/frameworks/next
 */

import { version } from 'flags'
import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as flags from '../../../flags'

export async function GET(request: NextRequest) {
  const secret = process.env.FLAGS_SECRET
  if (secret) {
    const discoveryWithAuth = createFlagsDiscoveryEndpoint(async () => getProviderData(flags), {
      secret,
    })
    return discoveryWithAuth(request)
  }
  // No FLAGS_SECRET: return definitions with SDK version header so toolbar doesn't show "outdated" (no auth)
  const apiData = getProviderData(flags)
  return NextResponse.json(apiData, {
    headers: {
      'content-type': 'application/json',
      'x-flags-sdk-version': version,
    },
  })
}
