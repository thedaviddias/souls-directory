/**
 * Sentry connectivity test endpoint
 *
 * GET /api/monitoring/sentry-test?key=<SENTRY_TEST_SECRET>
 *
 * Triggers a test exception that is sent to Sentry. For local dev, set in .env.local:
 * NEXT_PUBLIC_SENTRY_DSN, SENTRY_ENABLED_FOR_TEST=1, SENTRY_TEST_SECRET.
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

const SENTRY_TEST_MESSAGE = 'Sentry test event (souls.directory)'

function getSentryDebug() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const testFlag = process.env.SENTRY_ENABLED_FOR_TEST === '1'
  const prod = process.env.NODE_ENV === 'production'
  const enabled = !!dsn && (prod || testFlag)
  return {
    dsn_configured: !!dsn,
    sentry_enabled: enabled,
    node_env: process.env.NODE_ENV ?? 'unknown',
    sentry_enabled_for_test: testFlag,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const expected = process.env.SENTRY_TEST_SECRET

  if (!expected || key !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Set SENTRY_TEST_SECRET in env and pass ?key=<secret>' },
      { status: 401 }
    )
  }

  const debug = getSentryDebug()
  if (!debug.sentry_enabled) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Sentry is disabled on this run. Set NEXT_PUBLIC_SENTRY_DSN and (in dev) SENTRY_ENABLED_FOR_TEST=1 in .env.local, then restart the dev server.',
        debug,
      },
      { status: 200 }
    )
  }

  try {
    Sentry.captureException(new Error(SENTRY_TEST_MESSAGE), {
      tags: {
        source: 'sentry-test-route',
        environment: process.env.NODE_ENV ?? 'unknown',
      },
      extra: { ...debug },
    })
    await Sentry.flush(2000)
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Sentry capture failed',
        detail: err instanceof Error ? err.message : String(err),
        debug,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: `Test event sent. Check Sentry for an issue titled: ${SENTRY_TEST_MESSAGE}`,
    debug,
  })
}
