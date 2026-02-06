/**
 * Helper to check if Convex is configured
 * Falls back to mock data when not available
 */
export function isConvexConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)
}

/**
 * Get Convex URL or throw with helpful message
 */
export function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to create a project.')
  }
  return url
}
