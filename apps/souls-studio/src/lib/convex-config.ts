const CONVEX_URL_STORAGE_KEY = 'souls-studio:convex-url'

function normalizeUrl(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

export function getConfiguredConvexUrl() {
  const fromEnv = normalizeUrl(import.meta.env.VITE_CONVEX_URL)
  if (fromEnv) {
    return fromEnv
  }

  if (typeof window === 'undefined') {
    return null
  }

  return normalizeUrl(window.localStorage.getItem(CONVEX_URL_STORAGE_KEY))
}

export function saveConfiguredConvexUrl(url: string) {
  if (typeof window === 'undefined') {
    return
  }

  const normalized = normalizeUrl(url)
  if (normalized) {
    window.localStorage.setItem(CONVEX_URL_STORAGE_KEY, normalized)
  } else {
    window.localStorage.removeItem(CONVEX_URL_STORAGE_KEY)
  }
}
