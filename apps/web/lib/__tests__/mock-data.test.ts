import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../categories'
import type { Soul } from '../mock-data'
import {
  getMockCategories,
  getMockFeaturedSouls,
  getMockRecentSouls,
  getMockRelatedSouls,
  getMockSoul,
  getMockSoulsByCategory,
  mockCategories,
  mockSouls,
  searchSouls,
} from '../mock-data'

describe('mock-data', () => {
  describe('mockCategories', () => {
    it('contains expected categories', () => {
      expect(mockCategories).toHaveLength(CATEGORIES.length)
      expect(mockCategories.map((c) => c.slug)).toContain('professional')
      expect(mockCategories.map((c) => c.slug)).toContain('creative')
      expect(mockCategories.map((c) => c.slug)).toContain('technical')
    })

    it('each category has required fields', () => {
      for (const category of mockCategories) {
        expect(category).toHaveProperty('id')
        expect(category).toHaveProperty('slug')
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('description')
        expect(category).toHaveProperty('icon')
        expect(category).toHaveProperty('color')
      }
    })
  })

  describe('mockSouls', () => {
    it('contains expected souls', () => {
      expect(mockSouls.length).toBeGreaterThan(0)
      expect(mockSouls.map((s: Soul) => s.slug)).toContain('executive-assistant')
      expect(mockSouls.map((s: Soul) => s.slug)).toContain('code-reviewer')
    })

    it('each soul has required fields', () => {
      for (const soul of mockSouls) {
        expect(soul).toHaveProperty('id')
        expect(soul).toHaveProperty('slug')
        expect(soul).toHaveProperty('name')
        expect(soul).toHaveProperty('tagline')
        expect(soul).toHaveProperty('content')
        expect(soul).toHaveProperty('downloads')
      }
    })
  })

  describe('getMockCategories', () => {
    it('returns all categories', () => {
      const categories = getMockCategories()
      expect(categories).toEqual(mockCategories)
    })
  })

  describe('getMockFeaturedSouls', () => {
    it('returns only featured souls', () => {
      const featured = getMockFeaturedSouls()
      expect(featured.every((s: Soul) => s.featured === true)).toBe(true)
    })

    it('returns non-empty array when featured souls exist', () => {
      const featured = getMockFeaturedSouls()
      expect(featured.length).toBeGreaterThan(0)
    })
  })

  describe('getMockRecentSouls', () => {
    it('returns at most 4 souls', () => {
      const recent = getMockRecentSouls()
      expect(recent.length).toBeLessThanOrEqual(4)
    })
  })

  describe('getMockSoul', () => {
    it('returns soul by slug', () => {
      const soul = getMockSoul('executive-assistant')
      expect(soul).not.toBeNull()
      expect(soul?.name).toBe('Executive Assistant')
    })

    it('returns undefined for non-existent slug', () => {
      const soul = getMockSoul('non-existent-slug')
      expect(soul).toBeUndefined()
    })
  })

  describe('getMockRelatedSouls', () => {
    it('returns souls from same category', () => {
      const related = getMockRelatedSouls('1', 'stark')
      // All returned souls should have category_id '1'
      expect(related.every((s: Soul) => s.category_id === '1')).toBe(true)
    })

    it('excludes the specified soul', () => {
      const related = getMockRelatedSouls('1', 'stark')
      expect(related.every((s: Soul) => s.slug !== 'stark')).toBe(true)
    })

    it('returns at most 3 souls', () => {
      const related = getMockRelatedSouls('1', 'stark')
      expect(related.length).toBeLessThanOrEqual(3)
    })
  })

  describe('getMockSoulsByCategory', () => {
    it('returns souls matching the category slug', () => {
      const souls = getMockSoulsByCategory('professional')
      expect(souls.length).toBeGreaterThan(0)
      expect(souls.every((s: Soul) => s.category?.slug === 'professional')).toBe(true)
    })

    it('returns empty array for non-existent category', () => {
      const souls = getMockSoulsByCategory('non-existent-category')
      expect(souls).toEqual([])
    })

    it('returns all souls in the category', () => {
      const professionalSouls = getMockSoulsByCategory('professional')
      const expectedCount = mockSouls.filter((s) => s.category?.slug === 'professional').length
      expect(professionalSouls.length).toBe(expectedCount)
    })
  })

  describe('searchSouls', () => {
    it('finds souls by name', () => {
      const results = searchSouls('assistant')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((s: Soul) => s.name.toLowerCase().includes('assistant'))).toBe(true)
    })

    it('finds souls by tagline', () => {
      const results = searchSouls('executive')
      expect(results.length).toBeGreaterThan(0)
    })

    it('finds souls by description', () => {
      // Search for a word likely in descriptions
      const results = searchSouls('ai')
      expect(results.length).toBeGreaterThan(0)
    })

    it('is case insensitive', () => {
      const lowerResults = searchSouls('assistant')
      const upperResults = searchSouls('ASSISTANT')
      expect(lowerResults).toEqual(upperResults)
    })

    it('returns empty array for no matches', () => {
      const results = searchSouls('xyz123nonexistent')
      expect(results).toEqual([])
    })
  })
})
