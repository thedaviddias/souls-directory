'use client'

import { type ReactNode, createContext, useContext } from 'react'

interface FlagsContextValue {
  collectionsEnabled: boolean
}

const FlagsContext = createContext<FlagsContextValue>({
  collectionsEnabled: false,
})

export function useCollectionsEnabled(): boolean {
  return useContext(FlagsContext).collectionsEnabled
}

interface FlagsProviderProps {
  collectionsEnabled: boolean
  children: ReactNode
}

/**
 * Provides feature flag values to client components.
 * Values are resolved on the server (e.g. in root layout) and passed here.
 * Overrides from Vercel Toolbar Flags Explorer are applied when the toolbar is used.
 */
export function FlagsProvider({ collectionsEnabled, children }: FlagsProviderProps) {
  return <FlagsContext.Provider value={{ collectionsEnabled }}>{children}</FlagsContext.Provider>
}
