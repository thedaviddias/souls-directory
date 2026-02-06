# CLAUDE.md — Web App Context

## Quick Reference

- **Dev server**: `pnpm dev` (starts both Next.js and Convex dev)
- **Convex push**: `npx convex dev --once` (push function changes to dev)
- **Lint**: `pnpm biome check .` (Biome, not ESLint)
- **Test**: `pnpm vitest run`
- **Type check**: `pnpm tsc --noEmit`

## Key Directories

```
app/
├── browse/         # Browse/filter souls page
├── dashboard/      # User dashboard (authenticated)
├── login/          # GitHub OAuth login
├── settings/       # User settings
├── souls/[slug]/   # Individual soul detail page
├── u/[handle]/     # User profile page
├── upload/         # Upload wizard (4-step: Source → Review → Details → Publish)
├── import/         # Legacy import page
├── layout.tsx      # Root layout (Geist fonts, providers)
├── page.tsx        # Homepage (hero, featured souls)
└── globals.css     # CSS variables, Tailwind config

components/         # All UI components (see structure below)
convex/             # Convex backend
├── schema.ts       # Database schema (source of truth)
├── souls.ts        # Soul CRUD, publish, search
├── categories.ts   # Category queries
├── tags.ts         # Tag queries (create restricted to admin/moderator)
├── users.ts        # User profile management
├── seed.ts         # Data seeding functions
├── lib/
│   └── access.ts   # Auth helpers (getCurrentUser, getAuthenticatedUser, requireRole)
└── _generated/     # Auto-generated Convex types (do not edit)

hooks/              # Custom React hooks (direct imports, no barrel)
├── use-file-upload.ts      # File handling for upload wizard
├── use-soul-metadata.ts    # Metadata extraction from markdown
├── use-github-import.ts    # GitHub URL detection + content fetch
├── use-wizard-navigation.ts # Step navigation with validation
├── use-auth-status.ts      # Authentication state
├── use-clipboard.ts        # Copy to clipboard
└── use-keyboard-shortcuts.ts # Global keyboard shortcuts

lib/                # Pure utility functions
├── upload-utils.ts # File validation, metadata parsing, slug generation
└── api-response.ts # API response helpers
```

## Upload Wizard — Handle With Care

The upload wizard (`app/upload/page.tsx`) is the most complex page. It coordinates 4 custom hooks with async file reading and real-time Convex queries. Changes here frequently cause regressions.

### Architecture

```
upload/page.tsx (orchestrator)
  ├── useFileUpload()        → manages files[], content, drag/drop
  ├── useSoulMetadata()      → extracts name/tagline/description from content
  ├── useGitHubImport()      → detects SOUL.md from GitHub URLs
  └── useWizardNavigation()  → step state + forward validation
```

### Rules for Modifying Upload

1. **NEVER add localStorage/sessionStorage persistence** — it causes stale closures and state conflicts
2. **NEVER wrap event handlers in extra useCallback layers** — the hooks already use useCallback internally
3. **Test with a real .md file after every change** — not just visual inspection
4. **File input must use `<button onClick={() => ref.current?.click()}>` pattern** — not `<label htmlFor>`
5. **Do not add useEffect hooks that depend on hook return values** — these create cascading re-render loops
6. **The `useMemo` for `wizardReadiness` is critical** — it prevents unnecessary re-renders of the wizard

### Publish Flow

1. `handlePublish()` resolves tag names → tag IDs from existing tags list (users cannot create new tags)
2. Hashes content with SHA-256
3. Calls `souls.publish` mutation (which uses `getAuthenticatedUser`, NOT email lookup)
4. On success, redirects to `/souls/{slug}`

## Convex Auth

- Uses `@convex-dev/auth` with GitHub OAuth provider
- User lookup: always use `getAuthenticatedUser(ctx)` from `convex/lib/access.ts`
- This internally calls `getAuthUserId(ctx)` which returns the user's Convex `_id`
- **NEVER** use `ctx.auth.getUserIdentity()` then look up by email — emails may not be set

## Component Organization (Implemented)

Components are organized by domain in subfolders:

```
components/
├── browse/       # BrowseContent, CategoryCard, CategoryGrid
├── layout/       # Header, Footer, Breadcrumb, Providers
├── marketing/    # Hero, CTASection, SectionHeader, ScrollReveal, TypewriterText
├── search/       # SearchInput, SearchAutocomplete
├── shared/       # Badge, StatCard, EmptyState, Loading, CodeBlock, CopyButton, GithubStars
├── shortcuts/    # ShortcutsModal, KeyboardShortcutsProvider
├── souls/        # SoulCard, SoulGrid, SoulDetailContent
├── ui/           # Primitives (Button, Input, Dialog, DropdownMenu, etc.)
└── user/         # UserBootstrap
```

No barrel `index.ts` files anywhere. Import directly from the component file:

```typescript
import { Header } from '@/components/layout/header'
import { SoulCard } from '@/components/souls/soul-card'
import { useAuthStatus } from '@/hooks/use-auth-status'
```

## CSS Variables (globals.css)

```css
--bg: #0a0a0a;          /* Page background */
--surface: #141414;      /* Card/section background */
--elevated: #1a1a1a;     /* Elevated surfaces */
--border: #262626;       /* Borders */
--text: #fafafa;         /* Primary text */
--text-secondary: #a3a3a3; /* Secondary text */
--text-muted: #737373;   /* Muted/placeholder text */
```

## Testing

- **Framework**: Vitest with React Testing Library
- **Mocks**: `__mocks__/convex-react.ts` and `__mocks__/convex-auth-react.ts`
- **Convention**: Test files go next to their component as `__tests__/component-name.test.tsx`
