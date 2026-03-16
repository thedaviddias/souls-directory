import { getLatestVersion } from './changelog'

const LAST_SEEN_KEY = 'souls-studio-last-seen-version'

export function shouldShowWhatsNew(): boolean {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY)
  return lastSeen !== getLatestVersion()
}

export function markWhatsNewSeen(): void {
  localStorage.setItem(LAST_SEEN_KEY, getLatestVersion())
}
