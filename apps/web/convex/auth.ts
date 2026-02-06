import GitHub from '@auth/core/providers/github'
import { convexAuth } from '@convex-dev/auth/server'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? '',
      profile(profile) {
        // GitHub profile: id, login (username), name, email, avatar_url, created_at
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email ?? undefined,
          image: profile.avatar_url,
          // Custom fields passed through to createOrUpdateUser
          githubLogin: profile.login,
          githubId: String(profile.id),
          githubCreatedAt: profile.created_at,
        }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      console.log('[createOrUpdateUser] Called with profile:', args.profile)
      // biome-ignore lint/suspicious/noExplicitAny: Profile type from OAuth provider is dynamic
      const profile = args.profile as any
      console.log('[createOrUpdateUser] GitHub data:', {
        githubLogin: profile.githubLogin,
        githubId: profile.githubId,
        githubCreatedAt: profile.githubCreatedAt,
      })

      // --- Existing user: only patch fields that actually changed ---
      if (args.existingUserId) {
        const existing = await ctx.db.get(args.existingUserId)
        if (!existing) return args.existingUserId

        // biome-ignore lint/suspicious/noExplicitAny: patch object is dynamic
        const updates: any = {}

        // Always update image (avatar may change)
        if (args.profile.image && args.profile.image !== existing.image) {
          updates.image = args.profile.image
        }

        // Update name only if user hasn't set a custom displayName
        if (args.profile.name && !existing.displayName && args.profile.name !== existing.name) {
          updates.name = args.profile.name
        }

        // Update email if it changed
        if (args.profile.email && args.profile.email !== existing.email) {
          updates.email = args.profile.email
        }

        // Set GitHub fields if not already present
        if (profile.githubLogin && !existing.githubHandle) {
          updates.githubHandle = profile.githubLogin
        }
        if (profile.githubId && !existing.githubId) {
          updates.githubId = profile.githubId
        }
        if (profile.githubCreatedAt && !existing.githubCreatedAt) {
          updates.githubCreatedAt =
            typeof profile.githubCreatedAt === 'string'
              ? new Date(profile.githubCreatedAt).getTime()
              : profile.githubCreatedAt
          updates.githubFetchedAt = Date.now()
        }

        // Only patch if there are actual changes (avoids write conflicts on refreshSession)
        if (Object.keys(updates).length > 0) {
          console.log('[createOrUpdateUser] Patching existing user with updates:', updates)
          await ctx.db.patch(args.existingUserId, updates)
        } else {
          console.log('[createOrUpdateUser] No updates needed for existing user')
        }

        return args.existingUserId
      }

      // --- New user: insert with all available data ---
      // biome-ignore lint/suspicious/noExplicitAny: userData object structure depends on OAuth provider
      const userData: any = {
        name: args.profile.name,
        email: args.profile.email,
        image: args.profile.image,
      }

      if (profile.githubLogin) {
        userData.githubHandle = profile.githubLogin
      }
      if (profile.githubId) {
        userData.githubId = profile.githubId
      }
      if (profile.githubCreatedAt) {
        userData.githubCreatedAt =
          typeof profile.githubCreatedAt === 'string'
            ? new Date(profile.githubCreatedAt).getTime()
            : profile.githubCreatedAt
        userData.githubFetchedAt = Date.now()
      }

      console.log('[createOrUpdateUser] Creating new user with data:', userData)
      return await ctx.db.insert('users', userData)
    },
  },
})
