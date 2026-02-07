/**
 * Mock for next-plausible
 */
export function usePlausible() {
  return () => {}
}

export function PlausibleProvider({ children }: { children: React.ReactNode }) {
  return children
}
