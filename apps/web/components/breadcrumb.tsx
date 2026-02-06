'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

export interface BreadcrumbItem {
  name: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb navigation component with JSON-LD structured data for SEO.
 *
 * Always starts with "Home" automatically.
 *
 * @example
 * <Breadcrumb items={[{ name: 'Browse', href: '/browse' }, { name: 'Technical Writer' }]} />
 * // Renders: Home / Browse / Technical Writer
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname()

  // Build full breadcrumb list with Home prepended
  const fullItems = useMemo(() => [{ name: 'Home', href: '/' }, ...items], [items])

  // Generate JSON-LD structured data for SEO
  const jsonLd = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: fullItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.href ? `${baseUrl}${item.href}` : undefined,
      })),
    }
  }, [fullItems])

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visible breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex items-center gap-2 text-xs font-mono">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1
            const isActive = item.href === pathname

            return (
              <li key={item.href || item.name} className="flex items-center gap-2">
                {index > 0 && <span className="text-text-muted select-none">/</span>}
                {item.href && !isLast ? (
                  <Link
                    href={item.href as Route}
                    className={`
                      transition-colors
                      ${isActive ? 'text-text' : 'text-text-secondary hover:text-text'}
                    `}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-text-muted" aria-current={isLast ? 'page' : undefined}>
                    {item.name}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

/**
 * Generates breadcrumb items from a pathname.
 * Useful for dynamic routes.
 *
 * @example
 * const items = generateBreadcrumbItems('/souls/technical-writer', { 'technical-writer': 'Technical Writer' })
 * // Returns: [{ name: 'Souls', href: '/souls' }, { name: 'Technical Writer' }]
 */
export function generateBreadcrumbItems(
  pathname: string,
  labelMap: Record<string, string> = {}
): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []

  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`
    const isLast = i === segments.length - 1

    // Get label from map or capitalize segment
    const label =
      labelMap[segment] ||
      segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    items.push({
      name: label,
      href: isLast ? undefined : currentPath,
    })
  }

  return items
}
