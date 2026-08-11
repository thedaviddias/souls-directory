# @thedaviddias/analytics

OpenPanel analytics package for Next.js apps. Drop the provider into your layout to bootstrap the client SDK and optionally use the server SDK for backend event tracking.

## Exports

| Import path                                            | Description                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `@thedaviddias/analytics`                              | `AnalyticsProvider` — renders OpenPanel script tags                      |
| `@thedaviddias/analytics/head`                         | `AnalyticsHead` — thin wrapper for use inside `<head>`                   |
| `@thedaviddias/analytics/server`                       | `opServer` — server-side OpenPanel SDK singleton                         |

## Environment variables

| Variable                          | Required                      | Scope           | Description                                                                 |
| --------------------------------- | ----------------------------- | --------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` | Yes (for OpenPanel)           | Client + Server | OpenPanel client ID from your OpenPanel dashboard                           |
| `NEXT_PUBLIC_OPENPANEL_API_URL`   | Yes (self-hosted)             | Client + Server | Self-hosted API base URL, e.g. `https://stats.daviddias.digital/api`        |
| `OPENPANEL_CLIENT_SECRET`         | Only for server-side tracking | Server only     | OpenPanel client secret (never expose to the browser)                       |

These variables must be added to `turbo.json` → `tasks.build.env` so Turborepo invalidates the build cache when they change.

## Setup

### 1. Install the package

```bash
pnpm add @thedaviddias/analytics
```

### 2. Add the provider to your root layout

Place `AnalyticsHead` inside `<head>`:

```tsx
// app/layout.tsx
import { AnalyticsHead } from '@thedaviddias/analytics/head'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <AnalyticsHead openPanelClientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### 3. Create the OpenPanel proxy route

Create `app/api/op/[...path]/route.ts` to proxy analytics requests through your own domain (avoids ad blockers). Pass your self-hosted `apiUrl` so the proxy forwards to your instance instead of OpenPanel Cloud:

```ts
import { createRouteHandler } from '@openpanel/nextjs/server'

export const { GET, POST } = createRouteHandler({
  apiUrl: process.env.NEXT_PUBLIC_OPENPANEL_API_URL,
})
```

### 4. Add environment variables to turbo.json

```jsonc
// turbo.json → tasks.build.env
"NEXT_PUBLIC_OPENPANEL_CLIENT_ID",
"NEXT_PUBLIC_OPENPANEL_API_URL",
"OPENPANEL_CLIENT_SECRET",
```

## Server-side event tracking

For API routes and server actions, use the `trackServerEvent` helper with Vercel's `waitUntil`:

```ts
// lib/openpanel-server.ts
import { waitUntil } from '@vercel/functions'
import { opServer } from '@thedaviddias/analytics/server'

export function trackServerEvent(event: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') return
  waitUntil(opServer.track(event, properties ?? {}))
}
```

`opServer` reads `NEXT_PUBLIC_OPENPANEL_API_URL` so server-side events hit the same self-hosted instance.

This requires `@vercel/functions` installed in your app and `OPENPANEL_CLIENT_SECRET` set.

## How it works

```
AnalyticsHead
  └─ AnalyticsProvider
       └─ OpenPanelAnalyticsComponent  → loads op1.js via /api/op proxy
            └─ globalProperties: { environment }

opServer.track() (server)
  └─ OpenPanel SDK → direct API call to NEXT_PUBLIC_OPENPANEL_API_URL with clientSecret
```

Self-hosted deployments must set `NEXT_PUBLIC_OPENPANEL_API_URL` (path must end with `/api`). Without it, the proxy and server SDK fall back to OpenPanel Cloud.

## Production guards

OpenPanel tracking is gated behind `process.env.NODE_ENV === 'production'`:

1. **Component rendering** — `AnalyticsProvider` only renders `OpenPanelAnalyticsComponent` in production.
2. **Server-side tracking** — `trackServerEvent()` returns early in non-production.
