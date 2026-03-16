import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { isTauriRuntime } from './tauri'
import { authCallbackSchema, deepLinkUrlSchema } from './validation'

type SignInFn = (...args: any[]) => Promise<any>

/** Allowed deep link pathnames to prevent abuse of the protocol handler */
const ALLOWED_PATHS = new Set(['auth-callback'])

/**
 * Listens for `souls-studio://auth-callback?code=...` deep-links and
 * completes the Convex Auth OAuth flow by passing the code (along with
 * the verifier already stored in localStorage) back to the server.
 */
export async function setupDeepLinkAuthHandler(signIn: SignInFn) {
  if (!isTauriRuntime()) return

  const handleUrl = async (urlStr: string) => {
    try {
      // Validate the deep link URL schema
      const parsed = deepLinkUrlSchema.safeParse(urlStr)
      if (!parsed.success) return

      const url = new URL(urlStr)
      const pathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '')

      // Only allow known paths
      if (!ALLOWED_PATHS.has(pathname)) return

      const code = url.searchParams.get('code')
      if (!code) return

      // Validate the auth code format
      const codeResult = authCallbackSchema.safeParse({ code })
      if (!codeResult.success) return

      await signIn(undefined, { code: codeResult.data.code })
    } catch {
      /* ignore malformed URLs */
    }
  }

  // Handle deep-links while app is running
  await onOpenUrl((urls) => {
    for (const url of urls) {
      void handleUrl(url)
    }
  })

  // Handle cold-start deep-link (app launched via souls-studio://...)
  const currentUrls = await getCurrent()
  if (currentUrls) {
    for (const url of currentUrls) {
      await handleUrl(url)
    }
  }
}
