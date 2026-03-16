import { fetchMutation } from 'convex/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { api } from '@/lib/convex-api'

/**
 * POST /api/auth/desktop-relay
 * Stores an OAuth auth code for a desktop session.
 * Called by DesktopAuthRelay after the OAuth callback.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { session, code } = body as { session?: string; code?: string }

  if (!session || !code) {
    return NextResponse.json({ error: 'Missing session or code' }, { status: 400 })
  }

  await fetchMutation(api.desktopAuthCodes.store, { session, code })

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/auth/desktop-relay?session=SESSION_ID
 * Retrieves and deletes the stored auth code (one-time retrieval).
 * Polled by the Tauri desktop app.
 */
export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get('session')

  if (!session) {
    return NextResponse.json({ error: 'Missing session' }, { status: 400 })
  }

  const result = await fetchMutation(api.desktopAuthCodes.consume, { session })

  if (!result) {
    return NextResponse.json({ code: null }, { status: 404 })
  }

  return NextResponse.json({ code: result.code })
}
