/**
 * Version utilities for semantic versioning
 */

export type VersionBump = 'major' | 'minor' | 'patch'

/**
 * Bump a semver version string
 * @param currentVersion - Current version string (e.g., "1.2.3")
 * @param bumpType - Type of version bump
 * @returns New version string
 */
export function bumpVersion(currentVersion: string, bumpType: VersionBump): string {
  const parts = currentVersion.split('.').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return '1.0.1' // Fallback for invalid versions
  }
  const [major, minor, patch] = parts
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

/**
 * Validate semver format
 * @param version - Version string to validate
 * @returns True if valid semver
 */
export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(version)
}

/**
 * Get all possible bumped versions for display
 * @param currentVersion - Current version string
 * @returns Object with patch, minor, and major versions
 */
export function getAllBumpedVersions(currentVersion: string): {
  patch: string
  minor: string
  major: string
} {
  return {
    patch: bumpVersion(currentVersion, 'patch'),
    minor: bumpVersion(currentVersion, 'minor'),
    major: bumpVersion(currentVersion, 'major'),
  }
}
