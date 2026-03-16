/**
 * Parses CHANGELOG.md into src/generated/changelog.json
 *
 * Supports optional media metadata via HTML comments:
 *   <!-- meta: { "image": "/images/whats-new-0.2.0.png", "video": "dQw4w9WgXcQ" } -->
 *
 * Run: pnpm run changelog:generate
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
  image?: string
  video?: string
}

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..')
const INPUT = join(ROOT, 'CHANGELOG.md')
const OUTPUT = join(ROOT, 'src', 'generated', 'changelog.json')

function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []

  // Split by version headers: ## [x.y.z] - YYYY-MM-DD
  const versionRegex = /^## \[(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\]\s*-\s*(\d{4}-\d{2}-\d{2})/gm
  const matches = [...markdown.matchAll(versionRegex)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const version = match[1]
    const date = match[2]
    const startIndex = match.index! + match[0].length
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : markdown.length
    const section = markdown.slice(startIndex, endIndex)

    // Parse optional meta comment: <!-- meta: { ... } -->
    let image: string | undefined
    let video: string | undefined
    const metaMatch = section.match(/<!--\s*meta:\s*(\{[^}]+\})\s*-->/)
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1])
        image = meta.image
        video = meta.video
      } catch {
        console.warn(`Warning: Invalid meta JSON in v${version}, skipping media`)
      }
    }

    // Parse bullet points from ### Added, ### Changed, ### Fixed, etc.
    // We collect all `- ` lines as highlights
    const highlights: string[] = []
    const bulletRegex = /^- (.+)$/gm
    let bulletMatch: RegExpExecArray | null
    while ((bulletMatch = bulletRegex.exec(section)) !== null) {
      highlights.push(bulletMatch[1].trim())
    }

    if (highlights.length > 0) {
      entries.push({ version, date, highlights, image, video })
    }
  }

  return entries
}

// Main
const markdown = readFileSync(INPUT, 'utf-8')
const entries = parseChangelog(markdown)

if (entries.length === 0) {
  console.error('Error: No changelog entries found in CHANGELOG.md')
  process.exit(1)
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(entries, null, 2) + '\n')

console.log(`Generated ${OUTPUT} with ${entries.length} entries (latest: v${entries[0].version})`)
