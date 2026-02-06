import { z } from 'zod'

const slug = z
  .string()
  .min(1)
  .max(64)
  // allow lower/upper, digits, dash, underscore
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid slug')

export const SoulListQuerySchema = z.object({
  category: slug.optional(),
  tag: slug.optional(),
  q: z
    .string()
    .trim()
    .min(1)
    .max(64)
    // keep query safe for PostgREST filter string building
    .regex(/^[a-zA-Z0-9 _\-\.]+$/, 'Invalid search query')
    .optional(),
  sort: z.enum(['popular', 'recent', 'alphabetical']).default('popular'),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
})

export const SlugParamSchema = z.object({ slug })

export function parseSoulListQuery(searchParams: URLSearchParams) {
  const raw = {
    category: searchParams.get('category') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  }

  return SoulListQuerySchema.safeParse(raw)
}
