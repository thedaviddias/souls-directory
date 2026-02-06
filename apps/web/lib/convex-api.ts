/**
 * Convex API re-export with widened types.
 *
 * Convex's generated `api` applies `FilterApi` to resolve public functions.
 * With our backend size, TypeScript's type instantiation depth limit causes
 * `FilterApi` to silently drop some modules and functions from the resolved type.
 *
 * This wrapper preserves the original runtime `api` object while widening the
 * type so that:
 * - Modules dropped by `FilterApi` (e.g. soulActions, tags, collections, comments)
 *   remain accessible.
 * - Functions dropped within partially-resolved modules (e.g. search.searchSouls)
 *   remain accessible.
 * - The `useQuery(query, 'skip')` pattern continues to work because Convex's
 *   `OptionalRestArgsOrSkip` correctly handles the generated `any`-typed refs.
 *
 * This is a known Convex community pattern for large backends:
 * @see https://discord-questions.convex.dev/m/1386225704219443281
 *
 * Usage: `import { api } from '@/lib/convex-api'`
 */

import { api as generatedApi } from '@/convex/_generated/api'

/**
 * Widen each resolved module to also accept additional functions that FilterApi
 * may have dropped, and add an index signature for entirely missing modules.
 */
type WideApi = {
  [K in keyof typeof generatedApi]: (typeof generatedApi)[K] & Record<string, any>
} & Record<string, Record<string, any>>

export const api: WideApi = generatedApi as any
