import { getAuthUserId } from '@convex-dev/auth/server'
import { ConvexError } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * Get the current authenticated user from the database.
 * Returns null if not authenticated or user not found.
 *
 * Uses getAuthUserId from Convex Auth which directly returns the user's _id.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> {
  // getAuthUserId returns the user's _id directly from Convex Auth
  const userId = await getAuthUserId(ctx)
  if (!userId) return null

  const user = await ctx.db.get(userId)
  if (!user || user.deletedAt) return null

  return user
}

/**
 * Get the current authenticated user or throw if not authenticated.
 * Use this in mutations/queries that require authentication.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError('Authentication required')
  }
  return user
}

/**
 * Check if the current user has a specific role.
 * Returns false if not authenticated.
 */
export async function hasRole(
  ctx: QueryCtx | MutationCtx,
  roles: UserRole | UserRole[]
): Promise<boolean> {
  const user = await getCurrentUser(ctx)
  if (!user) return false

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(user.role ?? 'user')
}

/**
 * Require a specific role or throw an error.
 * Use this for admin/moderator-only functions.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roles: UserRole | UserRole[]
): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(user.role ?? 'user')) {
    throw new ConvexError('Insufficient permissions')
  }

  return user
}

/**
 * Check if the current user is the owner of a resource.
 */
export async function isOwner(
  ctx: QueryCtx | MutationCtx,
  ownerId: Doc<'users'>['_id']
): Promise<boolean> {
  const user = await getCurrentUser(ctx)
  if (!user) return false
  return user._id === ownerId
}

/**
 * Check if the current user can edit a resource (owner or admin/moderator).
 */
export async function canEdit(
  ctx: QueryCtx | MutationCtx,
  ownerId: Doc<'users'>['_id']
): Promise<boolean> {
  const user = await getCurrentUser(ctx)
  if (!user) return false

  // Owner can always edit
  if (user._id === ownerId) return true

  // Admins and moderators can edit any resource
  return ['admin', 'moderator'].includes(user.role ?? 'user')
}

/**
 * Require ownership of a resource or throw.
 */
export async function requireOwnership(
  ctx: QueryCtx | MutationCtx,
  ownerId: Doc<'users'>['_id']
): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)

  if (user._id !== ownerId) {
    throw new ConvexError('You do not own this resource')
  }

  return user
}

/**
 * Require ownership or admin/moderator role.
 */
export async function requireOwnershipOrRole(
  ctx: QueryCtx | MutationCtx,
  ownerId: Doc<'users'>['_id'],
  roles: UserRole | UserRole[] = ['admin', 'moderator']
): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx)
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (user._id !== ownerId && !allowedRoles.includes(user.role ?? 'user')) {
    throw new ConvexError('You do not have permission to perform this action')
  }

  return user
}
