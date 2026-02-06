import type { Category, Soul, Tag } from '@/types'

/**
 * Test fixtures for souls.directory
 * Centralized mock data for consistent testing
 */

export const mockCategory: Category = {
  id: '1',
  slug: 'coding',
  name: 'Coding',
  description: 'Developer assistants for all your coding needs',
  icon: '⚡',
  color: '#00ff88',
}

export const mockCategories: Category[] = [
  mockCategory,
  {
    id: '2',
    slug: 'companion',
    name: 'Companion',
    description: 'Friendly AI companions',
    icon: '💫',
    color: '#a855f7',
  },
  {
    id: '3',
    slug: 'researcher',
    name: 'Researcher',
    description: 'Deep research assistants',
    icon: '🔬',
    color: '#00d4ff',
  },
]

export const mockTag: Tag = {
  id: '1',
  slug: 'productivity',
  name: 'Productivity',
}

export const mockTags: Tag[] = [
  mockTag,
  { id: '2', slug: 'creative', name: 'Creative' },
  { id: '3', slug: 'technical', name: 'Technical' },
]

export const mockSoul: Soul = {
  id: '1',
  slug: 'stark',
  ownerHandle: 'openclaw',
  name: 'Stark',
  tagline: 'Sharp wit, clean code, no patience for mediocrity',
  description: 'A senior engineer with decades of battle scars.',
  content: `# SOUL.md

You are **Stark** — a senior software engineer with a sharp tongue and sharper code.

## Core Traits
- Direct and honest
- Values clean, maintainable code
- No patience for unnecessary complexity

## Communication Style
Be concise. Skip the fluff. Get to the point.
`,
  category_id: '1',
  author: 'OpenClaw',
  author_url: null,
  downloads: 2847,
  featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: mockCategory,
  tags: [mockTag],
}

export const mockSouls: Soul[] = [
  mockSoul,
  {
    id: '2',
    slug: 'ghost',
    ownerHandle: 'openclaw',
    name: 'Ghost',
    tagline: 'Invisible until needed. Maximum signal, zero noise.',
    description: 'A minimal presence that speaks only when necessary.',
    content: '# SOUL.md\n\nYou are **Ghost** — presence without noise.',
    category_id: '1',
    author: 'OpenClaw',
    author_url: null,
    downloads: 3421,
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: mockCategory,
    tags: [],
  },
]

/**
 * Create a mock soul with overrides
 */
export function createMockSoul(overrides: Partial<Soul> = {}): Soul {
  return {
    ...mockSoul,
    id: Math.random().toString(36).slice(2),
    ...overrides,
  }
}

/**
 * Create a mock category with overrides
 */
export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    ...mockCategory,
    id: Math.random().toString(36).slice(2),
    ...overrides,
  }
}
