# CLAUDE.md — Project Context for AI Assistants

## Project Overview

**souls.directory** is a curated directory of AI personality templates ("souls") — markdown-based SOUL.md files that define how AI agents behave. Users can browse, upload, and share these personality templates.

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom CSS variables (grayscale, dark-mode-only theme)
- **Database/Backend**: **Convex** (NOT Supabase, NOT Prisma, NOT any SQL database)
- **Auth**: Convex Auth (`@convex-dev/auth`) with GitHub OAuth
- **Package Manager**: pnpm with Turborepo monorepo
- **Linter**: Biome (not ESLint)
- **Fonts**: Geist Sans + Geist Mono

## Critical Rules

### Database is Convex

- Queries: `useQuery(api.tableName.queryName)`
- Mutations: `useMutation(api.tableName.mutationName)`
- Schema: `apps/web/convex/schema.ts`
- Functions: `apps/web/convex/*.ts`

### Auth Pattern

Always use `getAuthenticatedUser(ctx)` or `getCurrentUser(ctx)` from `convex/lib/access.ts`.

**NEVER** look up users by email via `ctx.auth.getUserIdentity()` — this is unreliable. The helper functions use `getAuthUserId(ctx)` from `@convex-dev/auth/server` which returns the Convex user `_id` directly.

### No Barrel Files

Do NOT create `index.ts` files that re-export from multiple modules. Import directly from the specific file.

```typescript
// BAD
import { SoulCard, Header } from '@/components'

// GOOD
import { SoulCard } from '@/components/souls/soul-card'
import { Header } from '@/components/layout/header'
```

### Upload Page is Fragile

The upload wizard at `apps/web/app/upload/page.tsx` has been a source of repeated regressions. When modifying it:

1. **Do NOT add complex state management** (localStorage persistence, useReducer, etc.) without careful testing
2. **Do NOT wrap handlers in unnecessary useCallback** — React's FileReader async callbacks are sensitive to stale closures
3. **Do NOT use `<label htmlFor>` for file inputs** — use a `<button>` with explicit `onClick={() => fileInputRef.current?.click()}`
4. **The file upload flow is**:
   - User clicks button → `fileInputRef.current?.click()`
   - Browser shows file picker → user selects file
   - `onChange` fires → `handleFileSelect` → `setFiles(prev => [...prev, ...selected])`
   - `normalizedFiles` memo recalculates
   - `useEffect` reads first `.md` file → `setContent(text)`
5. **Test file upload manually after ANY change to the upload page or its hooks**

### Component Hooks Architecture (Upload)

The upload wizard uses these custom hooks:
- `useFileUpload` — file drag/drop, reading, validation
- `useSoulMetadata` — metadata extraction and form state
- `useGitHubImport` — GitHub URL detection and content fetching
- `useWizardNavigation` — step navigation with forward validation

These hooks are in `apps/web/hooks/`. Do not add side effects that could cause re-renders during file reading.

## Monorepo Structure

```
/
├── apps/web/           # Next.js frontend
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   ├── convex/         # Convex backend functions + schema
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
├── content/            # Static markdown content (about, faq)
├── souls/              # Example soul templates (not served from here)
└── marketing/          # Marketing copy
```

## Convex Tables

Key tables (defined in `apps/web/convex/schema.ts`):
- `users` — user profiles with GitHub integration
- `souls` — the main content entries
- `soulVersions` — version history for each soul
- `categories` — predefined categories (seeded via `seed:seedCategories`)
- `tags` — predefined tags (seeded via `seed:seedTags`, only admin/moderator can create new tags)
- `stars` — user likes
- `comments` — soul comments with threading
- `collections` — user-created folders of souls

## Seeding Data

Categories and tags must be seeded in the Convex database:

```bash
cd apps/web
npx convex run --no-push seed:seedCategories
npx convex run --no-push seed:seedTags
```

## Design System

- **Dark-mode only** with grayscale palette
- CSS variables: `--bg`, `--surface`, `--elevated`, `--border`, `--text`, `--text-secondary`, `--text-muted`
- Typography: Geist Sans for body, Geist Mono for code/technical
- No emojis in UI unless user explicitly requests them
- Minimalist, typography-first design inspired by cursor.directory

### Accessibility — heading hierarchy

- **One h1 per page.** Each page has a single main title (e.g. homepage hero “Give your agent a soul.”, soul detail name, “Dashboard”, “Settings”). Do not add a second h1.
- **SectionHeader** is for section titles only. It defaults to `as="h2"`. Do NOT use `as="h1"` when the page already has its unique h1 (homepage, soul detail, dashboard, profile, etc.). Use `as="h2"` for sections under the page h1.

**Reviewing heading order:** Run static audit from `apps/web`: `pnpm audit:headings`. For per-page validation (one h1, no skipped levels), run e2e: `pnpm --filter @souls-directory/e2e test:e2e tests/accessibility-headings.spec.ts` (requires dev server).

## Development checks — run before commit

**One command** (from repo root):

```bash
pnpm validate
```

This runs **Biome** (lint + format with `--write`) then **TypeScript** (Turbo typecheck). If either fails, the script exits with a non-zero code. Use this before committing so the tree passes pre-commit (Biome) and typecheck.

- **When to run:** After editing `.ts`/`.tsx`/`.json` files, before committing, or when the user asks to “fix lint” / “fix types” / “can we commit?”.
- **Individual commands** (if needed): `pnpm check` (Biome, no write), `pnpm run check -- --write` (Biome with fixes), `pnpm typecheck`.

## Common Pitfalls

2. **Don't add dependencies to useEffect** that cause cascading re-renders — especially in the upload hooks
3. **Always test file upload after touching upload code** — FileReader callbacks are async and sensitive to component re-renders
4. **Use `getAuthenticatedUser(ctx)` not `ctx.auth.getUserIdentity()`** for user lookups in Convex mutations
5. **Categories/tags need seeding** — they don't exist until `seed:seedCategories` and `seed:seedTags` are run
6. **XSS** — User-supplied content (comments, descriptions, bios, etc.) is rendered via React's default escaping (e.g. `{comment.body}`). Do not use `dangerouslySetInnerHTML` with user input. The only `dangerouslySetInnerHTML` usage is for JSON-LD (server-built structured data), not user content.
