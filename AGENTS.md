# AGENTS.md

## Learned User Preferences

- Prefer TanStack ecosystem libraries when applicable (e.g. TanStack Virtual for list virtualization)
- Test UI changes in the browser after implementation; do not assume visual correctness from code alone
- Based in Canada; privacy compliance must account for PIPEDA and Quebec Law 25
- No session replay or invasive tracking without a consent banner; basic analytics is acceptable under implied consent
- Uses Typefully for drafting social media announcements
- Prefers `pnpm validate` as the single pre-commit check (Biome lint/format + TypeScript typecheck)

## Learned Workspace Facts

- Convex dev deployment slug: `careful-kangaroo-28` (site URL: `https://careful-kangaroo-28.convex.site`)
- Dev server uses `portless` tool; local URL is `http://souls.localhost:<port>/` (not `localhost:3000`)
- Convex env var `SITE_URL` must match the local portless URL for auth redirects to work
- OpenPanel analytics is proxied through `/api/op`; only active in production (gated by `AnalyticsProvider`)
- `@tanstack/react-virtual` is used for the `/souls` browse page grid virtualization with cursor-based infinite scroll
- GitHub OAuth env vars (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`) live in Convex dashboard, not `.env.local`
