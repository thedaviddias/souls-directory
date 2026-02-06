/**
 * Mock for convex/react
 */
// biome-ignore lint/suspicious/noExplicitAny: Mock implementation
export function useQuery(_query: any, _args?: any) {
  // Return null for user query (logged out state)
  return null
}

// biome-ignore lint/suspicious/noExplicitAny: Mock implementation
export function useMutation(_mutation: any) {
  return async () => {}
}

export function useConvex() {
  return {}
}

export function useConvexAuth() {
  return {
    isAuthenticated: false,
    isLoading: false,
  }
}

export class ConvexReactClient {
  // biome-ignore lint/complexity/noUselessConstructor: Mock class requires constructor signature
  constructor(_url: string) {}
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return children
}
