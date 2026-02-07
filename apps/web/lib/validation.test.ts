import { describe, expect, it } from 'vitest'

import { SlugParamSchema, SoulListQuerySchema, parseSoulListQuery } from './validation'

describe('SlugParamSchema', () => {
  it('accepts valid slug', () => {
    const res = SlugParamSchema.safeParse({ slug: 'stark-01' })
    expect(res.success).toBe(true)
  })

  it('accepts slug with underscore', () => {
    const res = SlugParamSchema.safeParse({ slug: 'my_soul_name' })
    expect(res.success).toBe(true)
  })

  it('rejects invalid slug with path traversal', () => {
    const res = SlugParamSchema.safeParse({ slug: 'stark/../../etc' })
    expect(res.success).toBe(false)
  })

  it('rejects empty slug', () => {
    const res = SlugParamSchema.safeParse({ slug: '' })
    expect(res.success).toBe(false)
  })

  it('rejects slug longer than 64 chars', () => {
    const res = SlugParamSchema.safeParse({ slug: 'a'.repeat(65) })
    expect(res.success).toBe(false)
  })
})

describe('SoulListQuerySchema', () => {
  it('accepts valid query with all fields', () => {
    const res = SoulListQuerySchema.safeParse({
      category: 'coding',
      tag: 'productivity',
      q: 'search term',
      sort: 'recent',
      featured: 'true',
      limit: '10',
      offset: '0',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.featured).toBe(true)
      expect(res.data.limit).toBe(10)
      expect(res.data.sort).toBe('recent')
    }
  })

  it('transforms featured string to boolean', () => {
    const resTrue = SoulListQuerySchema.safeParse({ featured: 'true' })
    const resFalse = SoulListQuerySchema.safeParse({ featured: 'false' })

    expect(resTrue.success).toBe(true)
    expect(resFalse.success).toBe(true)
    if (resTrue.success) expect(resTrue.data.featured).toBe(true)
    if (resFalse.success) expect(resFalse.data.featured).toBe(false)
  })

  it('applies default values', () => {
    const res = SoulListQuerySchema.safeParse({})
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.sort).toBe('popular')
      expect(res.data.limit).toBe(50)
      expect(res.data.offset).toBe(0)
    }
  })

  it('rejects limit over 100', () => {
    const res = SoulListQuerySchema.safeParse({ limit: '500' })
    expect(res.success).toBe(false)
  })

  it('rejects negative offset', () => {
    const res = SoulListQuerySchema.safeParse({ offset: '-1' })
    expect(res.success).toBe(false)
  })

  it('rejects invalid sort value', () => {
    const res = SoulListQuerySchema.safeParse({ sort: 'invalid' })
    expect(res.success).toBe(false)
  })

  it('rejects search query with special characters', () => {
    const res = SoulListQuerySchema.safeParse({ q: 'test;DROP TABLE' })
    expect(res.success).toBe(false)
  })

  // --- Security-relevant edge cases ---

  it('rejects search query with HTML tags (XSS)', () => {
    const res = SoulListQuerySchema.safeParse({ q: '<script>alert(1)</script>' })
    expect(res.success).toBe(false)
  })

  it('rejects search query with SQL injection characters', () => {
    for (const payload of ["' OR 1=1", '"; DROP TABLE;--', 'UNION SELECT * FROM users']) {
      const res = SoulListQuerySchema.safeParse({ q: payload })
      expect(res.success).toBe(false)
    }
  })

  it('rejects search query longer than 64 characters', () => {
    const res = SoulListQuerySchema.safeParse({ q: 'a'.repeat(65) })
    expect(res.success).toBe(false)
  })

  it('accepts search query with dots and hyphens', () => {
    const res = SoulListQuerySchema.safeParse({ q: 'my-soul.name' })
    expect(res.success).toBe(true)
  })

  it('trims whitespace from search query', () => {
    const res = SoulListQuerySchema.safeParse({ q: '  hello world  ' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.q).toBe('hello world')
    }
  })

  it('rejects category with path traversal attempt', () => {
    const res = SoulListQuerySchema.safeParse({ category: '../../../etc/passwd' })
    expect(res.success).toBe(false)
  })

  it('rejects offset beyond 10000', () => {
    const res = SoulListQuerySchema.safeParse({ offset: '10001' })
    expect(res.success).toBe(false)
  })

  it('coerces string numbers to actual numbers', () => {
    const res = SoulListQuerySchema.safeParse({ limit: '25', offset: '50' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(typeof res.data.limit).toBe('number')
      expect(typeof res.data.offset).toBe('number')
    }
  })
})

describe('parseSoulListQuery', () => {
  it('parses URLSearchParams correctly', () => {
    const params = new URLSearchParams()
    params.set('category', 'coding')
    params.set('sort', 'recent')
    params.set('limit', '20')

    const res = parseSoulListQuery(params)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.category).toBe('coding')
      expect(res.data.sort).toBe('recent')
      expect(res.data.limit).toBe(20)
    }
  })

  it('handles empty URLSearchParams', () => {
    const params = new URLSearchParams()
    const res = parseSoulListQuery(params)
    expect(res.success).toBe(true)
  })

  it('returns error for invalid params', () => {
    const params = new URLSearchParams()
    params.set('limit', '9999')
    const res = parseSoulListQuery(params)
    expect(res.success).toBe(false)
  })
})
