import { describe, expect, it } from 'vitest'
import {
  getDeletedUserAvatar,
  getUserDisplayName,
  getUserHandle,
  getUserImage,
  getUserProfileLink,
  isUserVisible,
} from '../user-display'

describe('getUserDisplayName', () => {
  it('returns Unknown User for null/undefined', () => {
    expect(getUserDisplayName(null)).toBe('Unknown User')
    expect(getUserDisplayName(undefined)).toBe('Unknown User')
  })

  it('returns Deleted User when deletedAt is set', () => {
    expect(getUserDisplayName({ deletedAt: Date.now() })).toBe('Deleted User')
  })

  it('returns displayName when set', () => {
    expect(getUserDisplayName({ displayName: 'Jane' })).toBe('Jane')
  })

  it('falls back to handle then Anonymous', () => {
    expect(getUserDisplayName({ handle: 'jane' })).toBe('jane')
    expect(getUserDisplayName({})).toBe('Anonymous')
  })
})

describe('getUserHandle', () => {
  it('returns null for null/undefined', () => {
    expect(getUserHandle(null)).toBeNull()
    expect(getUserHandle(undefined)).toBeNull()
  })

  it('returns null when deletedAt is set', () => {
    expect(getUserHandle({ handle: 'jane', deletedAt: 1 })).toBeNull()
  })

  it('returns handle when present', () => {
    expect(getUserHandle({ handle: 'jane' })).toBe('jane')
  })
})

describe('getUserImage', () => {
  it('returns null for null/undefined', () => {
    expect(getUserImage(null)).toBeNull()
  })

  it('returns null when deletedAt is set', () => {
    expect(getUserImage({ image: 'https://x.com/avatar', deletedAt: 1 })).toBeNull()
  })

  it('returns image URL when present', () => {
    expect(getUserImage({ image: 'https://example.com/avatar.png' })).toBe(
      'https://example.com/avatar.png'
    )
  })
})

describe('isUserVisible', () => {
  it('returns false for null/undefined', () => {
    expect(isUserVisible(null)).toBe(false)
    expect(isUserVisible(undefined)).toBe(false)
  })

  it('returns false when deletedAt is set', () => {
    expect(isUserVisible({ handle: 'jane', deletedAt: 1 })).toBe(false)
  })

  it('returns true for valid user', () => {
    expect(isUserVisible({ handle: 'jane' })).toBe(true)
  })
})

describe('getUserProfileLink', () => {
  it('returns null for null/undefined', () => {
    expect(getUserProfileLink(null)).toBeNull()
    expect(getUserProfileLink(undefined)).toBeNull()
  })

  it('returns null when deletedAt is set', () => {
    expect(getUserProfileLink({ handle: 'jane', deletedAt: 1 })).toBeNull()
  })

  it('returns null when handle is missing', () => {
    expect(getUserProfileLink({})).toBeNull()
  })

  it('returns profile path for valid user', () => {
    expect(getUserProfileLink({ handle: 'jane' })).toBe('/members/jane')
  })
})

describe('getDeletedUserAvatar', () => {
  it('returns a data URL SVG', () => {
    const result = getDeletedUserAvatar()
    expect(result).toMatch(/^data:image\/svg\+xml,/)
    expect(result).toContain('circle')
  })
})
