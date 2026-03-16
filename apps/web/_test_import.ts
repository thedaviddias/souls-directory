import type { FunctionReference } from 'convex/server'

// Try to import OptionalRestArgsOrSkip from the internal path
// @ts-expect-error
import type { OptionalRestArgsOrSkip } from '../../../node_modules/.pnpm/convex@1.31.7_react@19.2.4/node_modules/convex/dist/esm-types/react/client'

type Q = FunctionReference<'query', 'public', { limit?: number }, string[]>
type Result = OptionalRestArgsOrSkip<Q>
const _check: 'test' = 'test' as Result[0]
