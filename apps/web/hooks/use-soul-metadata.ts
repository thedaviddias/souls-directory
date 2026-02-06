'use client'

import type { Id } from '@/convex/_generated/dataModel'
import { logger } from '@/lib/logger'
import {
  SLUG_PATTERN,
  extractSoulMetadata,
  generateSlug,
  isMarkdownFile,
  isSoulFile,
} from '@/lib/upload-utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Which fields were auto-detected from the file content */
export type AutoDetectedFields = Partial<
  Record<'name' | 'slug' | 'tagline' | 'description' | 'category' | 'tags', boolean>
>

interface Category {
  _id: Id<'categories'>
  slug: string
  name: string
  icon: string
}

interface NormalizedFile {
  file: File
  path: string
}

/** Initial data for pre-populating form in edit mode */
export interface SoulMetadataInitialData {
  displayName: string
  slug: string
  tagline: string
  description: string
  categoryId: Id<'categories'> | null
  tags: string[]
}

interface UseSoulMetadataReturn {
  // Form fields
  displayName: string
  setDisplayName: (v: string) => void
  slug: string
  setSlug: (v: string) => void
  tagline: string
  setTagline: (v: string) => void
  description: string
  setDescription: (v: string) => void
  categoryId: Id<'categories'> | null
  setCategoryId: (v: Id<'categories'> | null) => void
  tagInput: string
  setTagInput: (v: string) => void
  selectedTags: string[]
  addTag: (tagName: string) => void
  removeTag: (tagName: string) => void
  setSelectedTags: (tags: string[]) => void
  // Auto-detection
  autoDetected: AutoDetectedFields
  // Validation
  metadataValidation: { issues: string[]; ready: boolean }
  // Pre-population for edit mode
  populateFromInitialData: (data: SoulMetadataInitialData) => void
}

/**
 * Manages soul metadata form state and auto-fills fields from markdown content.
 *
 * Parses the markdown structure to extract:
 *   - Name from `# SOUL.md - {Name}` heading
 *   - Tagline from italic `_..._` line
 *   - Description from `## Vibe` section
 *   - Slug from name
 *   - Category from folder path (if available)
 *   - Tags from YAML frontmatter (if present)
 */
export function useSoulMetadata(
  content: string,
  normalizedFiles: NormalizedFile[],
  categories: Category[]
): UseSoulMetadataReturn {
  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<Id<'categories'> | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Auto-detection tracking
  const [autoDetected, setAutoDetected] = useState<AutoDetectedFields>({})
  const autoFilledContentRef = useRef<string>('')

  // Auto-extract metadata when content or categories change
  useEffect(() => {
    if (!content) return

    const contentChanged = autoFilledContentRef.current !== content
    const categoriesJustLoaded = autoFilledContentRef.current === content && categories.length > 0

    if (!contentChanged && !categoriesJustLoaded) return
    autoFilledContentRef.current = content

    // Get file path for hints (filename → slug, folder → category)
    const mdFile =
      normalizedFiles.find((f) => isSoulFile(f.path)) ||
      normalizedFiles.find((f) => isMarkdownFile(f.path))

    try {
      const extracted = extractSoulMetadata(content, mdFile?.path)
      const detected: AutoDetectedFields = {}

      if (contentChanged) {
        if (extracted.name) {
          setDisplayName(extracted.name)
          detected.name = true
          setSlug(generateSlug(extracted.name))
          detected.slug = true
        }

        if (extracted.tagline) {
          setTagline(extracted.tagline)
          detected.tagline = true
        }

        if (extracted.description) {
          setDescription(extracted.description)
          detected.description = true
        }

        if (extracted.tags && extracted.tags.length > 0) {
          setSelectedTags(extracted.tags.slice(0, 5))
          detected.tags = true
        }
      }

      // Category matching (may need categories to load first)
      if (extracted.categorySlug && categories.length > 0) {
        const matched = categories.find((c) => c.slug.toLowerCase() === extracted.categorySlug)
        if (matched) {
          setCategoryId(matched._id)
          detected.category = true
        }
      }

      setAutoDetected((prev) => ({ ...prev, ...detected }))
    } catch (err) {
      logger.warn('Soul metadata extraction failed', { path: mdFile?.path })
    }
  }, [content, categories, normalizedFiles])

  // Tag management
  const addTag = useCallback(
    (tagName: string) => {
      const trimmed = tagName.trim().toLowerCase()
      if (trimmed && !selectedTags.includes(trimmed) && selectedTags.length < 5) {
        setSelectedTags((prev) => [...prev, trimmed])
      }
      setTagInput('')
    },
    [selectedTags]
  )

  const removeTag = useCallback((tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName))
  }, [])

  // Pre-populate form for edit mode
  const populateFromInitialData = useCallback((data: SoulMetadataInitialData) => {
    setDisplayName(data.displayName)
    setSlug(data.slug)
    setTagline(data.tagline)
    setDescription(data.description)
    setCategoryId(data.categoryId)
    setSelectedTags(data.tags)
    // Mark as not auto-detected since this is from existing data
    setAutoDetected({})
    // Update the ref to prevent content auto-fill from overwriting
    autoFilledContentRef.current = ''
  }, [])

  // Validation - memoized to prevent recalculation on every render
  const metadataValidation = useMemo(() => {
    const issues: string[] = []
    const trimmedSlug = slug.trim().toLowerCase()
    const trimmedName = displayName.trim()

    if (!trimmedSlug) {
      issues.push('Slug is required.')
    } else if (!SLUG_PATTERN.test(trimmedSlug)) {
      issues.push('Slug must be lowercase alphanumeric with dashes only.')
    }

    if (!trimmedName) {
      issues.push('Display name is required.')
    }

    return { issues, ready: issues.length === 0 }
  }, [slug, displayName])

  return {
    displayName,
    setDisplayName,
    slug,
    setSlug,
    tagline,
    setTagline,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    tagInput,
    setTagInput,
    selectedTags,
    addTag,
    removeTag,
    setSelectedTags,
    autoDetected,
    metadataValidation,
    populateFromInitialData,
  }
}
