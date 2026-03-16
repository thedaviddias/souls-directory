import { isTauriRuntime, openExternalUrl } from './tauri'

type SignInFn = (
  provider: string,
  params: { redirectTo: string }
) => Promise<{ signingIn: boolean; redirect?: URL }>

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Wraps Convex Auth's signIn() for Tauri desktop apps.
 *
 * Flow:
 * 1. Generates a session ID and passes it in `redirectTo`
 * 2. Overrides `navigator.product` to "ReactNative" so Convex Auth
 *    returns the OAuth URL without navigating the webview
 * 3. Opens the OAuth URL in the system browser
 * 4. Polls souls.directory/api/auth/desktop-relay for the auth code
 * 5. Completes auth with signIn(undefined, { code })
 *
 * Deep-links (souls-studio://) are also supported as a faster path
 * in production .app builds where macOS registers the URL scheme.
 */
export async function signInExternal(
  signIn: SignInFn,
  provider: string
): Promise<{ opened: boolean }> {
  if (!isTauriRuntime()) {
    await signIn(provider, { redirectTo: '/' })
    return { opened: false }
  }

  const sessionId = crypto.randomUUID()
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://souls.directory'
  const redirectTo = `/login?source=desktop&session=${sessionId}`

  // Temporarily spoof navigator.product so Convex Auth skips
  // window.location.href and just returns the redirect URL.
  const origDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'product')
  try {
    Object.defineProperty(Navigator.prototype, 'product', {
      value: 'ReactNative',
      configurable: true,
    })
  } catch {
    // If override fails, on_navigation in Rust will block the navigation
  }

  let redirectUrl: URL | undefined
  try {
    const result = await signIn(provider, { redirectTo })
    redirectUrl = result?.redirect
  } finally {
    // Restore original navigator.product
    try {
      if (origDescriptor) {
        Object.defineProperty(Navigator.prototype, 'product', origDescriptor)
      } else {
        // biome-ignore lint/performance/noDelete: restoring prototype to original state
        delete (Navigator.prototype as unknown as Record<string, unknown>).product
      }
    } catch {
      // Best-effort restore
    }
  }

  if (!redirectUrl) return { opened: false }

  // Open OAuth URL in system browser
  await openExternalUrl(redirectUrl.toString())

  // Poll for the auth code from the relay API
  const code = await pollForAuthCode(siteUrl, sessionId)
  if (code) {
    // Complete auth using the code + verifier stored earlier by signIn()
    await (signIn as (...args: unknown[]) => Promise<unknown>)(undefined, { code })
    return { opened: true }
  }

  return { opened: false }
}

async function pollForAuthCode(siteUrl: string, sessionId: string): Promise<string | null> {
  const maxAttempts = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS)

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    try {
      const res = await fetch(`${siteUrl}/api/auth/desktop-relay?session=${sessionId}`)
      if (res.ok) {
        const data = (await res.json()) as { code: string | null }
        if (data.code) return data.code
      }
    } catch {
      // Network error — keep polling
    }
  }

  return null
}
