/**
 * Upload utilities for SOUL.md files
 * Adapted from clawhub patterns
 */

// Text file extensions that are allowed
const TEXT_FILE_EXTENSIONS = new Set([
  'md',
  'markdown',
  'txt',
  'json',
  'yaml',
  'yml',
  'toml',
  'js',
  'ts',
  'tsx',
  'jsx',
  'css',
  'html',
  'svg',
  'xml',
])

// Content types that indicate text
const TEXT_CONTENT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'application/javascript',
])

/**
 * Check if a file is a text file based on extension or content type
 */
export function isTextFile(file: File): boolean {
  const path = (file.webkitRelativePath || file.name).trim().toLowerCase()
  if (!path) return false

  const parts = path.split('.')
  const extension = parts.length > 1 ? (parts.at(-1) ?? '') : ''

  if (file.type && TEXT_CONTENT_TYPES.has(file.type)) return true
  if (extension && TEXT_FILE_EXTENSIONS.has(extension)) return true

  return false
}

/**
 * Check if a path represents a text file
 */
export function isTextFilePath(path: string, contentType?: string): boolean {
  if (contentType && TEXT_CONTENT_TYPES.has(contentType)) return true

  const lower = path.toLowerCase()
  const parts = lower.split('.')
  const extension = parts.length > 1 ? (parts.at(-1) ?? '') : ''

  return TEXT_FILE_EXTENSIONS.has(extension)
}

/**
 * Normalize a file path
 */
export function normalizePath(path: string): string {
  return path
    .replaceAll('\u0000', '')
    .replaceAll('\\', '/')
    .trim()
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`
}

/**
 * Hash a file using SHA-256
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(buffer))
  const bytes = new Uint8Array(hash)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hash bytes using SHA-256
 */
export async function hashBytes(data: Uint8Array): Promise<string> {
  // Create a new ArrayBuffer to ensure compatibility with SubtleCrypto
  const buffer = new ArrayBuffer(data.length)
  new Uint8Array(buffer).set(data)
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(hash)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Slug validation pattern
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Validate a slug
 */
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

/**
 * Generate a slug from a display name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Constants for upload limits
 */
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50MB
export const MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_FILE_COUNT = 100

/**
 * Check if a file is a SOUL.md file (exact match)
 */
export function isSoulFile(path: string): boolean {
  const lower = path.toLowerCase()
  return lower === 'soul.md' || lower.endsWith('/soul.md')
}

/**
 * Check if a file is a valid markdown file that can be used as soul content
 */
export function isMarkdownFile(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

/**
 * Parse YAML frontmatter from markdown content.
 * Handles scalar values, inline arrays [a, b], and quoted strings.
 */
export function parseFrontmatter(content: string): Record<string, string | string[]> {
  const frontmatter: Record<string, string | string[]> = {}

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n')

  if (!normalized.startsWith('---')) return frontmatter

  const endIndex = normalized.indexOf('\n---', 3)
  if (endIndex < 0) return frontmatter

  const yaml = normalized.slice(4, endIndex).trim()
  const lines = yaml.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex <= 0) continue

    const key = line.slice(0, colonIndex).trim()
    // Only allow safe key names
    if (!/^[\w-]+$/.test(key)) continue

    let value = line.slice(colonIndex + 1).trim()

    // Remove surrounding quotes
    value = value.replace(/^["'](.*)["']$/, '$1')

    // Parse inline YAML arrays: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1)
      const items = inner
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
      frontmatter[key] = items
    } else {
      frontmatter[key] = value
    }
  }

  return frontmatter
}

/**
 * Metadata extracted from a SOUL.md file to auto-fill the upload form.
 *
 * Primary source: markdown content structure (heading, italic tagline, ## Vibe).
 * Secondary source: YAML frontmatter (if present — not required).
 * Tertiary source: filename and folder path hints.
 */
export interface ExtractedSoulMetadata {
  /** Display name — from `# SOUL.md - {Name}` heading, or frontmatter `title` */
  name?: string
  /** Short tagline — from italic line `_You're not a chatbot..._`, or frontmatter `description` */
  tagline?: string
  /** Longer description — from `## Vibe` section content, best personality summary */
  description?: string
  /** Category slug — from folder path (e.g. "creative/comedian.md" → "creative"), or frontmatter */
  categorySlug?: string
  /** Tag names — from frontmatter `tags` array (can't reliably infer from content) */
  tags?: string[]
  /** Model badges — from frontmatter `tested_with` */
  testedWith?: string[]
  /** Author — from frontmatter `author` */
  author?: string
}

/**
 * Extract the text content of a named `## Section` from markdown body.
 * Returns all lines between `## {heading}` and the next `##` heading (or end of file).
 */
function extractSection(body: string, heading: string): string | undefined {
  const pattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm')
  const match = pattern.exec(body)
  if (!match) return undefined

  const start = (match.index ?? 0) + match[0].length
  const rest = body.slice(start)

  // Find the next ## heading or end of string
  const nextHeading = rest.search(/^##\s+/m)
  const sectionBody = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest

  // Clean up: trim, remove trailing `---` separator, collapse whitespace
  const cleaned = sectionBody.replace(/---\s*$/s, '').trim()

  return cleaned || undefined
}

const DESCRIPTION_MAX_LENGTH = 500

/**
 * Strip markdown from section text and truncate at sentence or word boundary.
 * Used to produce a plain-text description from ## Vibe (or fallback) content.
 */
function sectionToDescription(rawSection: string, maxLength: number): string {
  if (!rawSection || !rawSection.trim()) return ''

  const lines = rawSection.split('\n')
  const processedLines: string[] = []

  for (const line of lines) {
    let s = line.trim()
    if (!s) continue
    // Strip ### / ## subheadings (keep the phrase)
    s = s.replace(/^#+\s*/, '')
    // Strip list bullets: - or * at start (with optional space after)
    s = s.replace(/^[-*]\s+/, '')
    // Strip bold: **text** → text (non-greedy)
    s = s.replace(/\*\*([^*]*)\*\*/g, '$1')
    // Strip italic: *text* → text (after ** removal, so no ** left)
    s = s.replace(/\*([^*]+)\*/g, '$1')
    if (s.trim()) processedLines.push(s.trim())
  }

  const plain = processedLines.join(' ').replace(/\s+/g, ' ').trim()
  if (!plain) return ''

  if (plain.length <= maxLength) return plain

  const head = plain.slice(0, maxLength)
  const lastSentenceEnd = Math.max(
    head.lastIndexOf('. '),
    head.lastIndexOf('! '),
    head.lastIndexOf('? ')
  )
  if (lastSentenceEnd >= 0) return plain.slice(0, lastSentenceEnd + 1).trim()
  const lastSpace = head.lastIndexOf(' ')
  if (lastSpace > 0) return plain.slice(0, lastSpace).trim()
  return plain.slice(0, maxLength).trim()
}

/**
 * Extract rich metadata from a SOUL.md file.
 *
 * Works without frontmatter by parsing the markdown structure:
 *   1. `# SOUL.md - {Name}` → name
 *   2. `_{italic tagline}_` → tagline
 *   3. `## Vibe` section → description
 *
 * Also supports YAML frontmatter as a bonus (title, description, category, tags, etc.)
 *
 * Optionally accepts a filename/path for additional hints:
 *   - `comedian.md` → slug hint "comedian"
 *   - `creative/comedian.md` → category hint "creative"
 */
export function extractSoulMetadata(content: string, filePath?: string): ExtractedSoulMetadata {
  const meta: ExtractedSoulMetadata = {}

  // ---- Optional: frontmatter (bonus, not required) ----

  const fm = parseFrontmatter(content)

  if (typeof fm.title === 'string' && fm.title) {
    meta.name = fm.title
  }
  if (typeof fm.description === 'string' && fm.description) {
    meta.tagline = fm.description
  }
  if (typeof fm.category === 'string' && fm.category) {
    meta.categorySlug = fm.category.toLowerCase()
  }
  if (Array.isArray(fm.tags)) {
    meta.tags = fm.tags.map((t) => t.toLowerCase())
  }
  if (Array.isArray(fm.tested_with)) {
    meta.testedWith = fm.tested_with
  }
  if (typeof fm.author === 'string' && fm.author) {
    meta.author = fm.author
  }

  // ---- Primary: parse markdown content structure ----

  // Strip frontmatter block for body parsing
  let body = content
  const normalized = content.replace(/\r\n/g, '\n')
  if (normalized.startsWith('---')) {
    const end = normalized.indexOf('\n---', 3)
    if (end > 0) {
      body = normalized.slice(end + 4).trim()
    }
  }

  // Name: from `# SOUL.md - {Name}` heading
  if (!meta.name) {
    const headingMatch = body.match(/^#\s+(.+)$/m)
    if (headingMatch) {
      let heading = headingMatch[1].trim()
      // Strip common prefixes: "SOUL.md - ", "SOUL.md – ", "SOUL.md — "
      heading = heading.replace(/^SOUL\.md\s*[-–—:]\s*/i, '')
      meta.name = heading
    }
  }

  // Tagline: italic line right after the heading
  // Matches: _You're not a chatbot. You're the funny dev..._
  if (!meta.tagline) {
    const italicMatch = body.match(/^#\s+.+\n\n_([^_]+)_/m)
    if (italicMatch) {
      meta.tagline = italicMatch[1].trim().slice(0, 100)
    }
  }

  // Description: prefer `## Vibe` section (the best personality summary)
  if (!meta.description) {
    const vibeContent = extractSection(body, 'Vibe')
    if (vibeContent) {
      meta.description = sectionToDescription(vibeContent, DESCRIPTION_MAX_LENGTH)
    }
  }

  // Description fallback: try `## Communication Style` or first real paragraph
  if (!meta.description) {
    const commStyle = extractSection(body, 'Communication Style')
    if (commStyle) {
      meta.description = sectionToDescription(commStyle, DESCRIPTION_MAX_LENGTH)
    }
  }

  // Final description fallback: first non-heading, non-tagline paragraph
  if (!meta.description) {
    const lines = body.split('\n')
    let pastHeading = false
    let pastTagline = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!pastHeading) {
        if (trimmed.startsWith('# ')) pastHeading = true
        continue
      }
      if (!trimmed) continue
      if (!pastTagline && trimmed.startsWith('_') && trimmed.endsWith('_')) {
        pastTagline = true
        continue
      }
      if (trimmed.startsWith('## ')) break
      meta.description = sectionToDescription(trimmed, DESCRIPTION_MAX_LENGTH)
      break
    }
  }

  // ---- Tertiary: filename / folder path hints ----

  if (filePath) {
    const parts = filePath.replace(/\\/g, '/').split('/')
    const filename = parts[parts.length - 1] ?? ''

    // Slug hint from filename: "comedian.md" → "comedian", "my-soul.md" → "my-soul"
    // Only use if we already have a name (don't override name from filename)
    const nameFromFile = filename.replace(/\.md$|\.markdown$/i, '').replace(/^soul$/i, '') // Skip if the file is literally "SOUL.md"

    // If we got a name from content, use it. But if name is missing, use filename.
    if (!meta.name && nameFromFile) {
      // Title-case the filename: "code-reviewer" → "Code Reviewer"
      meta.name = nameFromFile
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }

    // Category hint from parent folder: "creative/comedian.md" → "creative"
    if (!meta.categorySlug && parts.length >= 2) {
      const parentFolder = parts[parts.length - 2]?.toLowerCase()
      if (parentFolder && parentFolder !== 'souls') {
        meta.categorySlug = parentFolder
      }
    }
  }

  return meta
}

/**
 * Format a publish error for display
 */
export function formatPublishError(error: unknown): string {
  if (error instanceof Error) {
    // Clean up Convex error messages
    let message = error.message
    message = message.replace(/^Uncaught Error:\s*/, '')
    message = message.replace(/^ConvexError:\s*/, '')
    return message
  }
  return 'An unexpected error occurred'
}

/**
 * WebKit file system entry types
 */
type WebkitDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null
}

interface FileSystemEntry {
  isFile: boolean
  isDirectory: boolean
  name: string
  fullPath: string
}

interface FileSystemFileEntry extends FileSystemEntry {
  file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader
}

interface FileSystemDirectoryReader {
  readEntries(
    successCallback: (entries: FileSystemEntry[]) => void,
    errorCallback?: (error: Error) => void
  ): void
}

/**
 * Collect a single file system entry (file or directory)
 */
async function collectEntry(
  entry: FileSystemEntry,
  basePath: string,
  files: File[]
): Promise<void> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })

    // Create new file with path preserved
    const path = basePath ? `${basePath}/${entry.name}` : entry.name
    const newFile = new File([file], path, { type: file.type, lastModified: file.lastModified })
    Object.defineProperty(newFile, 'webkitRelativePath', { value: path })
    files.push(newFile)
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()
    const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name

    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      const allEntries: FileSystemEntry[] = []
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) {
            resolve(allEntries)
          } else {
            allEntries.push(...batch)
            readBatch()
          }
        }, reject)
      }
      readBatch()
    })

    for (const subEntry of entries) {
      await collectEntry(subEntry, dirPath, files)
    }
  }
}

/**
 * Expand dropped items (files and directories) into a flat file list
 */
export async function expandDroppedItems(items: DataTransferItemList | null): Promise<File[]> {
  if (!items || items.length === 0) return []

  const dropped: File[] = []
  const entries: FileSystemEntry[] = []

  for (const item of Array.from(items)) {
    const webkitItem = item as WebkitDataTransferItem
    const entry = webkitItem.webkitGetAsEntry?.()

    if (entry) {
      entries.push(entry)
      continue
    }

    const file = item.getAsFile()
    if (file) dropped.push(file)
  }

  if (entries.length === 0) return dropped

  for (const entry of entries) {
    await collectEntry(entry, '', dropped)
  }

  return dropped
}

/**
 * Unwrap single top-level folder if all files are inside it
 */
export function unwrapSingleTopLevelFolder<T extends { path: string }>(entries: T[]): T[] {
  if (entries.length === 0) return entries

  const firstPath = entries[0].path
  const firstSlash = firstPath.indexOf('/')
  if (firstSlash === -1) return entries

  const topFolder = firstPath.slice(0, firstSlash + 1)
  const allSameFolder = entries.every((e) => e.path.startsWith(topFolder))

  if (!allSameFolder) return entries

  return entries.map((e) => ({
    ...e,
    path: e.path.slice(topFolder.length),
  }))
}
