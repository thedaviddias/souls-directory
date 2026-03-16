export interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
  image?: string
  video?: string
}

// Generated at build time from CHANGELOG.md by scripts/generate-changelog.ts
// Vite resolves JSON imports at build time — zero runtime cost
import generatedChangelog from '../generated/changelog.json'

export const changelog: ChangelogEntry[] = generatedChangelog

export function getLatestVersion(): string {
  return changelog[0]?.version ?? '0.0.0'
}
