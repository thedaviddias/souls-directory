/**
 * Utilities for displaying user information with respect to deleted accounts
 */

import { profilePath } from '@/lib/routes'

export type UserProfile = {
  _id?: string
  handle?: string
  displayName?: string
  bio?: string
  image?: string
  githubHandle?: string
  deletedAt?: number
  createdAt?: number
}

/**
 * Get the display name for a user, showing "Deleted User" for deleted accounts
 */
export function getUserDisplayName(user: UserProfile | null | undefined): string {
  if (!user) return 'Unknown User'
  if (user.deletedAt) return 'Deleted User'
  return user.displayName || user.handle || 'Anonymous'
}

/**
 * Get the user's handle, showing a deleted placeholder for deleted accounts
 */
export function getUserHandle(user: UserProfile | null | undefined): string | null {
  if (!user) return null
  if (user.deletedAt) return null
  return user.handle || null
}

/**
 * Get the user's profile image URL, showing null for deleted accounts
 */
export function getUserImage(user: UserProfile | null | undefined): string | null {
  if (!user) return null
  if (user.deletedAt) return null
  return user.image || null
}

/**
 * Check if a user profile should be publicly accessible
 */
export function isUserVisible(user: UserProfile | null | undefined): boolean {
  if (!user) return false
  // Deleted users are not publicly visible on their profile page
  // but their content remains attributed to "Deleted User"
  return !user.deletedAt
}

/**
 * Get a safe profile link for a user
 * Returns null for deleted users (no profile page)
 */
export function getUserProfileLink(user: UserProfile | null | undefined): string | null {
  if (!user || user.deletedAt || !user.handle) return null
  return profilePath(user.handle)
}

/**
 * Get a placeholder for deleted user avatars
 */
export function getDeletedUserAvatar(): string {
  // Simple gray circle SVG as data URL
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23404040"/%3E%3C/svg%3E'
}
