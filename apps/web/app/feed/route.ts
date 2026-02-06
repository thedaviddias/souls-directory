/**
 * RSS/Atom Feed Route Handler
 *
 * Generates an RSS 2.0 feed of the latest souls.
 * Access at: /feed or /feed.xml
 *
 * Also supports Atom format via query param: /feed?format=atom
 */

import { getSoulsForFeed } from '@/lib/convex-server'
import { logger } from '@/lib/logger'
import { profilePath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import { NextResponse } from 'next/server'

// Revalidate every 5 minutes
export const revalidate = 300

// Type for feed soul items
type FeedSoul = NonNullable<Awaited<ReturnType<typeof getSoulsForFeed>>>[number]

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRFC822Date(timestamp: number): string {
  return new Date(timestamp).toUTCString()
}

function formatISO8601Date(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

function generateRSS(souls: Awaited<ReturnType<typeof getSoulsForFeed>>): string {
  const { name, url, description } = SITE_CONFIG
  const now = new Date().toUTCString()

  const items = souls
    .map((soul: FeedSoul) => {
      const itemUrl = `${url}/souls/${soul.ownerHandle}/${soul.slug}`
      const pubDate = formatRFC822Date(soul.createdAt)
      const updateDate = formatRFC822Date(soul.updatedAt)

      // Build description with tagline and excerpt
      let itemDescription = soul.tagline
      if (soul.description) {
        itemDescription += `\n\n${soul.description}`
      }
      if (soul.contentExcerpt) {
        itemDescription += `\n\n---\n\n${soul.contentExcerpt}${soul.contentExcerpt.length >= 500 ? '...' : ''}`
      }

      return `    <item>
      <title>${escapeXml(soul.name)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <description><![CDATA[${itemDescription}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${soul.categoryName ? `<category>${escapeXml(soul.categoryName)}</category>` : ''}
      ${soul.authorName ? `<author>${escapeXml(soul.authorName)}</author>` : ''}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(name)}</title>
    <link>${url}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${url}/feed" rel="self" type="application/rss+xml"/>
    <image>
      <url>${url}/icon-192.png</url>
      <title>${escapeXml(name)}</title>
      <link>${url}</link>
    </image>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`
}

function generateAtom(souls: Awaited<ReturnType<typeof getSoulsForFeed>>): string {
  const { name, url, description } = SITE_CONFIG
  const now = formatISO8601Date(Date.now())

  const entries = souls
    .map((soul: FeedSoul) => {
      const entryUrl = `${url}/souls/${soul.ownerHandle}/${soul.slug}`
      const published = formatISO8601Date(soul.createdAt)
      const updated = formatISO8601Date(soul.updatedAt)

      // Build summary
      let summary = soul.tagline
      if (soul.description) {
        summary += ` ${soul.description}`
      }

      return `  <entry>
    <title>${escapeXml(soul.name)}</title>
    <link href="${entryUrl}" rel="alternate" type="text/html"/>
    <id>${entryUrl}</id>
    <published>${published}</published>
    <updated>${updated}</updated>
    <summary type="text">${escapeXml(summary)}</summary>
    ${soul.categoryName ? `<category term="${escapeXml(soul.categorySlug || '')}" label="${escapeXml(soul.categoryName)}"/>` : ''}
    ${
      soul.authorName
        ? `<author>
      <name>${escapeXml(soul.authorName)}</name>
      ${soul.authorHandle ? `<uri>${escapeXml(`${url.replace(/\/$/, '')}${profilePath(soul.authorHandle)}`)}</uri>` : ''}
    </author>`
        : ''
    }
    ${soul.contentExcerpt ? `<content type="text"><![CDATA[${soul.contentExcerpt}${soul.contentExcerpt.length >= 500 ? '...' : ''}]]></content>` : ''}
  </entry>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(name)}</title>
  <subtitle>${escapeXml(description)}</subtitle>
  <link href="${url}/feed?format=atom" rel="self" type="application/atom+xml"/>
  <link href="${url}" rel="alternate" type="text/html"/>
  <id>${url}/</id>
  <updated>${now}</updated>
  <icon>${url}/favicon.ico</icon>
  <logo>${url}/icon-192.png</logo>
${entries}
</feed>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  try {
    const souls = await getSoulsForFeed(20)

    const isAtom = format === 'atom'
    const content = isAtom ? generateAtom(souls) : generateRSS(souls)
    const contentType = isAtom ? 'application/atom+xml' : 'application/rss+xml'

    return new NextResponse(content, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    logger.error('Error generating feed', error)
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 })
  }
}
