import type { Id } from '@/convex/_generated/dataModel'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSoulMetadata } from '../use-soul-metadata'

type CategoriesParam = Parameters<typeof useSoulMetadata>[2]
const mockCategories: CategoriesParam = [
  { _id: 'cat-1' as Id<'categories'>, slug: 'creative', name: 'Creative', icon: 'palette' },
  { _id: 'cat-2' as Id<'categories'>, slug: 'technical', name: 'Technical', icon: 'code' },
]

describe('useSoulMetadata', () => {
  it('initializes with empty form state', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    expect(result.current.displayName).toBe('')
    expect(result.current.slug).toBe('')
    expect(result.current.tagline).toBe('')
    expect(result.current.description).toBe('')
    expect(result.current.categoryId).toBeNull()
    expect(result.current.selectedTags).toEqual([])
    expect(result.current.metadataValidation.ready).toBe(false)
    expect(result.current.metadataValidation.issues.length).toBeGreaterThan(0)
  })

  it('extracts name and slug from content with SOUL.md heading', () => {
    const content = `# SOUL.md - My Agent

_You are a helpful assistant._

## Vibe

Friendly and concise.`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    expect(result.current.displayName).toBe('My Agent')
    expect(result.current.slug).toBe('my-agent')
    expect(result.current.autoDetected.name).toBe(true)
    expect(result.current.autoDetected.slug).toBe(true)
  })

  it('extracts tagline from italic line', () => {
    const content = `# SOUL.md - Bot

_You are a helpful assistant._

## Vibe

Nothing.`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    expect(result.current.tagline).toBe('You are a helpful assistant.')
    expect(result.current.autoDetected.tagline).toBe(true)
  })

  it('extracts description from ## Vibe section', () => {
    const content = `# SOUL.md - Bot

_Tagline._

## Vibe

This is the vibe description.`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    expect(result.current.description).toContain('vibe description')
    expect(result.current.autoDetected.description).toBe(true)
  })

  it('extracts category from frontmatter and matches categories', () => {
    const content = `---
title: Comedian
category: creative
---

# SOUL.md - Comedian`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    expect(result.current.categoryId).toBe('cat-1')
    expect(result.current.autoDetected.category).toBe(true)
  })

  it('extracts tags from frontmatter', () => {
    const content = `---
title: Test
tags: [funny, dev]
---

# SOUL.md - Test`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    expect(result.current.selectedTags).toEqual(['funny', 'dev'])
    expect(result.current.autoDetected.tags).toBe(true)
  })

  it('addTag adds trimmed lowercase tag and clears input', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    act(() => {
      result.current.setTagInput('  NewTag  ')
      result.current.addTag('  NewTag  ')
    })
    expect(result.current.selectedTags).toEqual(['newtag'])
    expect(result.current.tagInput).toBe('')
  })

  it('addTag does not add duplicate or exceed 5 tags', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    act(() => {
      result.current.addTag('a')
      result.current.addTag('a')
      result.current.addTag('b')
      result.current.addTag('c')
      result.current.addTag('d')
      result.current.addTag('e')
      result.current.addTag('f')
    })
    expect(result.current.selectedTags).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('removeTag removes the tag', () => {
    const content = `---
tags: [x, y]
---
# SOUL.md - T`
    const { result } = renderHook(() => useSoulMetadata(content, [], mockCategories))
    act(() => {
      result.current.removeTag('x')
    })
    expect(result.current.selectedTags).toEqual(['y'])
  })

  it('metadataValidation requires slug and display name', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    expect(result.current.metadataValidation.ready).toBe(false)
    act(() => {
      result.current.setDisplayName('Name')
      result.current.setSlug('valid-slug')
    })
    expect(result.current.metadataValidation.ready).toBe(true)
  })

  it('metadataValidation rejects invalid slug format', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    act(() => {
      result.current.setDisplayName('Name')
      result.current.setSlug('Invalid Slug!')
    })
    expect(result.current.metadataValidation.ready).toBe(false)
    expect(result.current.metadataValidation.issues.some((i) => i.includes('lowercase'))).toBe(true)
  })

  it('populateFromInitialData sets all form fields', () => {
    const { result } = renderHook(() => useSoulMetadata('', [], mockCategories))
    const data = {
      displayName: 'Initial',
      slug: 'initial',
      tagline: 'Tag',
      description: 'Desc',
      categoryId: 'cat-2' as Id<'categories'>,
      tags: ['t1', 't2'],
    }
    act(() => {
      result.current.populateFromInitialData(data)
    })
    expect(result.current.displayName).toBe('Initial')
    expect(result.current.slug).toBe('initial')
    expect(result.current.tagline).toBe('Tag')
    expect(result.current.description).toBe('Desc')
    expect(result.current.categoryId).toBe('cat-2')
    expect(result.current.selectedTags).toEqual(['t1', 't2'])
    expect(result.current.autoDetected).toEqual({})
  })
})
