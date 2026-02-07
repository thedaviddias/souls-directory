/**
 * llms.txt route — machine-readable index for AI agents and LLMs.
 *
 * Follows the llms.txt proposal (https://llmstxt.org/): markdown at /llms.txt
 * with H1, blockquote summary, and H2 file-list sections. Enables agents to
 * discover and fetch SOUL.md content without scraping the full site.
 *
 * Statically generated at build time (force-static). Served from Vercel edge
 * CDN — no serverless/edge function runs on request. Convex is only used
 * during `next build`. With revalidate, the first request after the interval
 * triggers a serverless run to regenerate; all other traffic is static.
 */

import { CATEGORIES } from '@/lib/categories'
import { getAllSoulsForSitemap } from '@/lib/convex-server'
import { ROUTES, soulPath, soulsByCategoryPath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 3600

type SitemapSoul = NonNullable<Awaited<ReturnType<typeof getAllSoulsForSitemap>>>[number]

function buildLlmsTxt(souls: SitemapSoul[]): string {
  const { url, name, description } = SITE_CONFIG
  const base = url.replace(/\/$/, '')

  const categoryLines = CATEGORIES.sort((a, b) => a.order - b.order)
    .map((cat) => `- [${cat.name}](${base}${soulsByCategoryPath(cat.slug)})`)
    .join('\n')

  const soulLines =
    souls.length > 0
      ? souls
          .map((soul) => {
            const handle = soul.ownerHandle ?? ''
            const pageUrl = `${base}${soulPath(handle, soul.slug)}`
            const rawUrl = `${base}/api/souls/${handle}/${soul.slug}.md`
            const displayName = soul.name ?? soul.slug
            return `- [${displayName}](${pageUrl}) — \`GET ${rawUrl}\``
          })
          .join('\n')
      : ''

  return `# ${name}

> ${description}

## API

- **Fetch a soul (raw SOUL.md)**: \`GET ${base}/api/souls/{handle}/{slug}.md\` — replace \`{handle}\` and \`{slug}\` with the soul's owner handle and slug (see Souls list below).
- **Browse souls**: [Browse all](${base}${ROUTES.souls})
- **Search souls (JSON)**: \`GET ${base}/api/souls/search?q=...&category=...&limit=10\` — returns JSON with slug, name, tagline, installCommand.

## Categories

${categoryLines}

## Souls

${soulLines || '(none)'}

## Quick Install (OpenClaw)

To install a soul into your OpenClaw workspace:

\`\`\`bash
curl ${base}/api/souls/{handle}/{slug}.md > ~/.openclaw/workspace/SOUL.md
\`\`\`

Replace \`{handle}\` and \`{slug}\` with the soul's handle and slug from the directory.

## Links

- [llms.txt](${base}/llms.txt)
- [About](${base}${ROUTES.about})
- [FAQ](${base}${ROUTES.faq})
- [Submit a soul](${base}${ROUTES.upload})
- [OpenClaw](${SITE_CONFIG.socials.openclaw})
`
}

export async function GET() {
  const souls = (await getAllSoulsForSitemap()) ?? []
  const body = buildLlmsTxt(souls)

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
      'X-Souls-Directory': 'true',
    },
  })
}
