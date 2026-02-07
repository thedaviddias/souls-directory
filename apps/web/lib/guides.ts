/**
 * Server-side guide content loader.
 * Reads MDX files from content/guides/, parses frontmatter, extracts headings, and computes reading time.
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { slugify } from './slugify'

// =============================================================================
// Types
// =============================================================================

export interface GuideFrontmatter {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  keywords?: string[]
  author?: string
}

export interface GuideHeading {
  id: string
  text: string
  level: 2 | 3
}

export interface Guide {
  slug: string
  frontmatter: GuideFrontmatter
  content: string
  readingTime: number
  headings: GuideHeading[]
}

// =============================================================================
// Paths
// =============================================================================

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides')

function getGuidesDir(): string {
  return GUIDES_DIR
}

// =============================================================================
// Heading extraction (h2, h3 from markdown)
// =============================================================================

/**
 * Normalize raw markdown heading text so it matches the visible text produced
 * by React (getHeadingText in mdx-components). Ensures TOC anchor IDs match h2/h3 id attributes.
 * Strips link syntax [text](url) -> text, and bold/code so slugs stay in sync.
 */
function normalizeHeadingText(raw: string): string {
  return raw
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [link text](url) -> link text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // **bold** -> bold
    .replace(/__([^_]*)__/g, '$1') // __bold__ -> bold
    .replace(/`([^`]*)`/g, '$1') // `code` -> code
    .replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic
    .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
    .trim()
}

function extractHeadings(content: string): GuideHeading[] {
  const headings: GuideHeading[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    const h3 = line.match(/^###\s+(.+)$/)
    if (h2) {
      const raw = h2[1].trim()
      const text = normalizeHeadingText(raw)
      headings.push({ id: slugify(text), text, level: 2 })
    } else if (h3) {
      const raw = h3[1].trim()
      const text = normalizeHeadingText(raw)
      headings.push({ id: slugify(text), text, level: 3 })
    }
  }
  return headings
}

// =============================================================================
// Load single guide
// =============================================================================

export function getGuide(slug: string): Guide | null {
  const dir = getGuidesDir()
  const filePath = path.join(dir, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = data as GuideFrontmatter
  const stats = readingTime(content)
  const headings = extractHeadings(content)
  return {
    slug,
    frontmatter,
    content,
    readingTime: Math.max(1, Math.ceil(stats.minutes)),
    headings,
  }
}

// =============================================================================
// List all guides
// =============================================================================

export function getGuidesSlugs(): string[] {
  const dir = getGuidesDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.basename(f, '.mdx'))
}

export function getAllGuides(): Guide[] {
  const slugs = getGuidesSlugs()
  const guides: Guide[] = []
  for (const slug of slugs) {
    const guide = getGuide(slug)
    if (guide) guides.push(guide)
  }
  // Sort by publishedAt descending
  guides.sort((a, b) => {
    const da = new Date(a.frontmatter.publishedAt).getTime()
    const db = new Date(b.frontmatter.publishedAt).getTime()
    return db - da
  })
  return guides
}
