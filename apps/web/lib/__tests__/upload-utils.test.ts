import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_COUNT,
  MAX_SINGLE_FILE_BYTES,
  MAX_TOTAL_BYTES,
  SLUG_PATTERN,
  extractSoulMetadata,
  formatBytes,
  formatPublishError,
  generateSlug,
  isMarkdownFile,
  isSoulFile,
  isTextFile,
  isTextFilePath,
  isValidSlug,
  normalizePath,
  parseFrontmatter,
  unwrapSingleTopLevelFolder,
} from '../upload-utils'

describe('upload-utils', () => {
  describe('normalizePath', () => {
    it('replaces backslashes with forward slashes', () => {
      expect(normalizePath('a\\b\\c')).toBe('a/b/c')
    })

    it('trims and removes leading ./ and /', () => {
      expect(normalizePath('./foo/bar')).toBe('foo/bar')
      expect(normalizePath('/foo/bar')).toBe('foo/bar')
    })

    it('strips null bytes', () => {
      expect(normalizePath('a\u0000b')).toBe('ab')
    })
  })

  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(500)).toBe('500 B')
    })

    it('formats KB', () => {
      expect(formatBytes(1024)).toBe('1.0 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('formats MB', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    })

    it('returns 0 B for non-finite', () => {
      expect(formatBytes(Number.NaN)).toBe('0 B')
      expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
    })
  })

  describe('isTextFile', () => {
    it('returns true for .md file', () => {
      const file = new File([''], 'test.md', { type: 'text/markdown' })
      expect(isTextFile(file)).toBe(true)
    })

    it('returns true for text/plain content type', () => {
      const file = new File([''], 'data.txt', { type: 'text/plain' })
      expect(isTextFile(file)).toBe(true)
    })

    it('returns false for unknown extension and type', () => {
      const file = new File([''], 'image.png', { type: 'image/png' })
      expect(isTextFile(file)).toBe(false)
    })
  })

  describe('isTextFilePath', () => {
    it('returns true for .md path', () => {
      expect(isTextFilePath('foo.md')).toBe(true)
      expect(isTextFilePath('path/to/file.markdown')).toBe(true)
    })

    it('returns true for text content type', () => {
      expect(isTextFilePath('file.xyz', 'text/plain')).toBe(true)
    })

    it('returns false for non-text path', () => {
      expect(isTextFilePath('image.png')).toBe(false)
    })
  })

  describe('SLUG_PATTERN and isValidSlug', () => {
    it('validates slug pattern', () => {
      expect(isValidSlug('hello')).toBe(true)
      expect(isValidSlug('hello-world')).toBe(true)
      expect(isValidSlug('abc123')).toBe(true)
      expect(isValidSlug('a-b-c')).toBe(true)
    })

    it('rejects invalid slugs', () => {
      expect(isValidSlug('')).toBe(false)
      expect(isValidSlug('Hello')).toBe(false)
      expect(isValidSlug('hello_world')).toBe(false)
      expect(isValidSlug('-hello')).toBe(false)
      expect(isValidSlug('hello-')).toBe(false)
    })
  })

  describe('generateSlug', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(generateSlug('My Soul Name')).toBe('my-soul-name')
    })

    it('trims and strips leading/trailing hyphens', () => {
      expect(generateSlug('  hello world  ')).toBe('hello-world')
      expect(generateSlug('---hello---')).toBe('hello')
    })

    it('removes non-alphanumeric', () => {
      expect(generateSlug('Hello, World!')).toBe('hello-world')
    })
  })

  describe('constants', () => {
    it('exports expected limits', () => {
      expect(MAX_TOTAL_BYTES).toBe(50 * 1024 * 1024)
      expect(MAX_SINGLE_FILE_BYTES).toBe(10 * 1024 * 1024)
      expect(MAX_FILE_COUNT).toBe(100)
    })
  })

  describe('isSoulFile', () => {
    it('returns true for soul.md', () => {
      expect(isSoulFile('soul.md')).toBe(true)
      expect(isSoulFile('path/to/soul.md')).toBe(true)
    })

    it('returns false for other files', () => {
      expect(isSoulFile('readme.md')).toBe(false)
      expect(isSoulFile('soul.txt')).toBe(false)
    })
  })

  describe('isMarkdownFile', () => {
    it('returns true for .md and .markdown', () => {
      expect(isMarkdownFile('x.md')).toBe(true)
      expect(isMarkdownFile('x.markdown')).toBe(true)
    })

    it('returns false for other extensions', () => {
      expect(isMarkdownFile('x.txt')).toBe(false)
    })
  })

  describe('parseFrontmatter', () => {
    it('returns empty object when no frontmatter', () => {
      expect(parseFrontmatter('just content')).toEqual({})
      expect(parseFrontmatter('---\nno closing')).toEqual({})
    })

    it('parses simple key: value', () => {
      const content = `---
name: My Soul
description: A helper
---
# Body`
      expect(parseFrontmatter(content)).toEqual({
        name: 'My Soul',
        description: 'A helper',
      })
    })

    it('parses inline array', () => {
      const content = `---
tags: [a, b, c]
---
# Body`
      expect(parseFrontmatter(content)).toEqual({ tags: ['a', 'b', 'c'] })
    })
  })

  describe('formatPublishError', () => {
    it('returns message for Error', () => {
      expect(formatPublishError(new Error('Something failed'))).toBe('Something failed')
    })

    it('strips ConvexError prefix', () => {
      expect(formatPublishError(new Error('ConvexError: Invalid slug'))).toBe('Invalid slug')
    })

    it('returns generic message for non-Error', () => {
      expect(formatPublishError('string')).toBe('An unexpected error occurred')
    })
  })

  describe('unwrapSingleTopLevelFolder', () => {
    it('unwraps when all files are in one top-level folder', () => {
      const entries = [{ path: 'folder/a.md' }, { path: 'folder/b.md' }]
      expect(unwrapSingleTopLevelFolder(entries)).toEqual([{ path: 'a.md' }, { path: 'b.md' }])
    })

    it('leaves as-is when multiple top-level folders', () => {
      const entries = [{ path: 'folder1/a.md' }, { path: 'folder2/b.md' }]
      expect(unwrapSingleTopLevelFolder(entries)).toEqual(entries)
    })
  })

  describe('extractSoulMetadata description extraction', () => {
    it('strips markdown from ## Vibe section (bold, bullets, subheadings)', () => {
      const content = `# SOUL.md - Groot

_Tagline._

## Vibe

**Minimalist but meaningful.** You use few words.

**Voice characteristics:**
- Primarily speaks: "I am Groot"
- Varies tone/emphasis to convey meaning
- Repetition for emphasis.`
      const meta = extractSoulMetadata(content)
      expect(meta.description).not.toContain('**')
      expect(meta.description).not.toContain('- ')
      expect(meta.description).toContain('Minimalist but meaningful')
      expect(meta.description).toContain('Primarily speaks')
      expect(meta.description).toContain('Repetition for emphasis')
    })

    it('truncates at sentence boundary, not mid-word', () => {
      const longSentence = `${'A'.repeat(400)}. ${'B'.repeat(200)}`
      const content = `# SOUL.md - Test

_Tagline._

## Vibe

${longSentence}`
      const meta = extractSoulMetadata(content)
      expect(meta.description).toHaveLength(401) // 400 + '.'
      expect(meta.description).toMatch(/\.$/)
      expect(meta.description).not.toContain('B')
    })

    it('truncates at word boundary when no sentence end in first 500 chars', () => {
      const noPeriod = 'word '.repeat(120) // 600 chars, no . ! ?
      const content = `# SOUL.md - Test

_Tagline._

## Vibe

${noPeriod}`
      const meta = extractSoulMetadata(content)
      expect(meta.description?.length).toBeLessThanOrEqual(500)
      expect(meta.description).not.toMatch(/\s\w$/) // does not end with single letter (cut word)
    })

    it('returns plain text for Groot-style Vibe with mixed markdown', () => {
      const content = `# SOUL.md - Groot

_We are Groot._

## Vibe

**Minimalist but meaningful.** You use few words, but each one carries weight. You speak in "I am Groot" — the same phrase that means different things based on context, tone, and intention. Others must learn to understand you; you don't simplify yourself for their convenience.

**Voice characteristics:**
- Primarily speaks: "I am Groot"
- Varies tone/emphasis to convey meaning
- Occasionally uses "We are Groot" for collective unity
- Long pauses before speaking (consideration)
- Repetition for emphasis.`
      const meta = extractSoulMetadata(content)
      expect(meta.description).not.toContain('**')
      expect(meta.description).not.toMatch(/^\s*-\s+/m)
      expect(meta.description).toContain('Minimalist but meaningful.')
      expect(meta.description).toContain('Repetition for emphasis.')
      expect(meta.description?.length).toBeLessThanOrEqual(500)
    })
  })
})
