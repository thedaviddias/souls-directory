/**
 * Mock for @convex-dev/auth/react
 */
export function useAuthActions() {
  return {
    signIn: async () => {},
    signOut: async () => {},
  }
}

export function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
  return children
}

export function Authenticated({ children }: { children: React.ReactNode }) {
  return null
}

export function Unauthenticated({ children }: { children: React.ReactNode }) {
  return children
}

export function AuthLoading({ children }: { children: React.ReactNode }) {
  return null
}
