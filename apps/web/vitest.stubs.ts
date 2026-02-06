/**
 * Stub exports for external dependencies used in tests
 */

// canvas-confetti stub
export default function confetti() {
  // no-op stub
}

// Convex API stub
export const api = {
  users: {
    me: 'users:me',
    ensure: 'users:ensure',
    updateProfile: 'users:updateProfile',
    getByHandle: 'users:getByHandle',
    getSoulsByUser: 'users:getSoulsByUser',
    getMySouls: 'users:getMySouls',
    getMyStarredSouls: 'users:getMyStarredSouls',
    deleteAccount: 'users:deleteAccount',
  },
  souls: {
    list: 'souls:list',
    getByOwnerAndSlug: 'souls:getByOwnerAndSlug',
    getContent: 'souls:getContent',
    trackDownload: 'souls:trackDownload',
    toggleStar: 'souls:toggleStar',
    isStarred: 'souls:isStarred',
    listFeatured: 'souls:listFeatured',
    listTrending: 'souls:listTrending',
  },
  categories: {
    list: 'categories:list',
  },
  search: {
    fulltext: 'search:fulltext',
  },
}

// Convex Auth stubs
export function useAuthActions() {
  return {
    signIn: async () => {},
    signOut: async () => {},
  }
}

export function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
  return children
}
