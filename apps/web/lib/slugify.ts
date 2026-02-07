/**
 * Slugify text for URL fragments and heading IDs.
 * Shared by lib/guides.ts (TOC hrefs) and components/guides/mdx-components.tsx (h2/h3 id)
 * so that anchor links and IDs always match.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
