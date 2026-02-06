/**
 * llms.txt route — machine-readable index for AI agents and LLMs.
 *
 * Follows the llms.txt proposal (https://llmstxt.org/): markdown at /llms.txt
 * with H1, blockquote summary, and H2 file-list sections. Enables agents to
 * discover and fetch SOUL.md content without scraping the full site.
 */

import { CATEGORIES } from '@/lib/categories'
import { ROUTES, soulsByCategoryPath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 3600 // 1 hour

function buildLlmsTxt(): string {
  const { url, name, description } = SITE_CONFIG
  const base = url.replace(/\/$/, '')

  const categoryLines = CATEGORIES.sort((a, b) => a.order - b.order)
    .map((cat) => `- [${cat.name}](${base}${soulsByCategoryPath(cat.slug)})`)
    .join('\n')

  return `# ${name}

> ${description}

## API

- **Fetch a soul (raw SOUL.md)**: \`GET ${base}/api/souls/{slug}.md\` — replace \`{slug}\` with the soul's slug (e.g. \`professional-developer\`).
- **Browse souls**: [Browse all](${base}${ROUTES.souls})
- **Search souls (JSON)**: \`GET ${base}/api/souls/search?q=...&category=...&limit=10\` — returns JSON with slug, name, tagline, installCommand.

## Categories

${categoryLines}

## Quick Install (OpenClaw)

To install a soul into your OpenClaw workspace:

\`\`\`bash
curl ${base}/api/souls/{slug}.md > ~/.openclaw/workspace/SOUL.md
\`\`\`

Replace \`{slug}\` with the soul's slug from the directory.

## Links

- [About](${base}${ROUTES.about})
- [FAQ](${base}${ROUTES.faq})
- [Submit a soul](${base}${ROUTES.upload})
- [OpenClaw](${SITE_CONFIG.socials.openclaw})
`
}

export function GET() {
  const body = buildLlmsTxt()
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
