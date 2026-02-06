import { getAuthUserId } from '@convex-dev/auth/server'
import { query } from './_generated/server'

export const debugMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return { error: 'Not authenticated' }
    }

    const user = await ctx.db.get(userId)
    if (!user) {
      return { error: 'User not found' }
    }

    return {
      _id: user._id,
      handle: user.handle,
      displayName: user.displayName,
      name: user.name,
      bio: user.bio,
      websiteUrl: user.websiteUrl,
      xHandle: user.xHandle ?? user.twitterHandle,
      githubHandle: user.githubHandle,
      githubId: user.githubId,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
    }
  },
})
