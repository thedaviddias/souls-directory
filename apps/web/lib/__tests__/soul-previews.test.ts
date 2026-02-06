import { describe, expect, it } from 'vitest'
import { getSoulPreview, soulPreviews } from '../soul-previews'

describe('soulPreviews', () => {
  it('should have preview text for executive-assistant', () => {
    expect(soulPreviews['executive-assistant']).toBeDefined()
    expect(soulPreviews['executive-assistant']).toContain('blocked')
  })

  it('should have preview text for code-reviewer', () => {
    expect(soulPreviews['code-reviewer']).toBeDefined()
    expect(soulPreviews['code-reviewer']).toContain('line 42')
  })

  it('should have preview text for zen-master', () => {
    expect(soulPreviews['zen-master']).toBeDefined()
    expect(soulPreviews['zen-master']).toContain('debug')
  })

  it('should have preview text for film-noir-detective', () => {
    expect(soulPreviews['film-noir-detective']).toBeDefined()
    expect(soulPreviews['film-noir-detective']).toContain('undefined')
  })

  it('should have a default preview', () => {
    expect(soulPreviews.default).toBeDefined()
    expect(soulPreviews.default).toBe('Hello! I adapt to your workflow. Try me out.')
  })

  it('should have unique previews for different souls', () => {
    const previews = Object.values(soulPreviews)
    const uniquePreviews = new Set(previews)
    expect(uniquePreviews.size).toBe(previews.length)
  })
})

describe('getSoulPreview', () => {
  it('should return preview for known soul', () => {
    const preview = getSoulPreview('executive-assistant')

    expect(preview).toBe(soulPreviews['executive-assistant'])
  })

  it('should return preview for code-reviewer', () => {
    const preview = getSoulPreview('code-reviewer')

    expect(preview).toBe(soulPreviews['code-reviewer'])
  })

  it('should return default preview for unknown soul', () => {
    const preview = getSoulPreview('unknown-soul-that-does-not-exist')

    expect(preview).toBe(soulPreviews.default)
  })

  it('should return default preview for empty string', () => {
    const preview = getSoulPreview('')

    expect(preview).toBe(soulPreviews.default)
  })

  it('should handle case-sensitive slugs', () => {
    // The function is case-sensitive
    const preview = getSoulPreview('Executive-Assistant')

    expect(preview).toBe(soulPreviews.default) // Not found because case doesn't match
  })

  it('should return string type', () => {
    const preview = getSoulPreview('zen-master')

    expect(typeof preview).toBe('string')
    expect(preview.length).toBeGreaterThan(0)
  })
})
