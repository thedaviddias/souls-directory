import { describe, expect, it } from 'vitest'
import { bumpVersion, getAllBumpedVersions, isValidSemver } from '../version-utils'

describe('version-utils', () => {
  describe('bumpVersion', () => {
    it('bumps patch version', () => {
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4')
      expect(bumpVersion('2.0.0', 'patch')).toBe('2.0.1')
    })

    it('bumps minor version', () => {
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0')
      expect(bumpVersion('2.0.0', 'minor')).toBe('2.1.0')
    })

    it('bumps major version', () => {
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0')
      expect(bumpVersion('2.0.0', 'major')).toBe('3.0.0')
    })

    it('returns 1.0.1 for invalid version (wrong part count)', () => {
      expect(bumpVersion('1.2', 'patch')).toBe('1.0.1')
      expect(bumpVersion('1', 'patch')).toBe('1.0.1')
      expect(bumpVersion('1.2.3.4', 'patch')).toBe('1.0.1')
    })

    it('returns 1.0.1 for invalid version (non-numeric)', () => {
      expect(bumpVersion('1.2.x', 'patch')).toBe('1.0.1')
      expect(bumpVersion('a.b.c', 'patch')).toBe('1.0.1')
    })
  })

  describe('isValidSemver', () => {
    it('accepts valid x.y.z', () => {
      expect(isValidSemver('1.0.0')).toBe(true)
      expect(isValidSemver('0.0.0')).toBe(true)
      expect(isValidSemver('12.34.56')).toBe(true)
    })

    it('accepts valid semver with prerelease', () => {
      expect(isValidSemver('1.0.0-alpha')).toBe(true)
      expect(isValidSemver('1.0.0-beta.1')).toBe(true)
    })

    it('accepts valid semver with build', () => {
      expect(isValidSemver('1.0.0+build')).toBe(true)
      expect(isValidSemver('1.0.0+20250101')).toBe(true)
    })

    it('rejects invalid semver', () => {
      expect(isValidSemver('')).toBe(false)
      expect(isValidSemver('1.0')).toBe(false)
      expect(isValidSemver('1.0.0.0')).toBe(false)
      expect(isValidSemver('v1.0.0')).toBe(false)
    })
  })

  describe('getAllBumpedVersions', () => {
    it('returns patch, minor, and major bumped versions', () => {
      const result = getAllBumpedVersions('1.2.3')
      expect(result).toEqual({
        patch: '1.2.4',
        minor: '1.3.0',
        major: '2.0.0',
      })
    })

    it('uses fallback for invalid version', () => {
      const result = getAllBumpedVersions('invalid')
      expect(result.patch).toBe('1.0.1')
      expect(result.minor).toBe('1.0.1')
      expect(result.major).toBe('1.0.1')
    })
  })
})
