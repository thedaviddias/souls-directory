import { type NextRequest, NextResponse } from 'next/server'

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const store = new Map<string, { code: string; createdAt: number }>()

function cleanExpired() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.createdAt > CODE_TTL_MS) {
      store.delete(key)
    }
  }
}

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

  cleanExpired()
  store.set(session, { code, createdAt: Date.now() })

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

  cleanExpired()
  const entry = store.get(session)

  if (!entry) {
    return NextResponse.json({ code: null }, { status: 404 })
  }

  store.delete(session)
  return NextResponse.json({ code: entry.code })
}
