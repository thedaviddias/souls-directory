/**
 * Custom MDX component overrides for guide articles.
 * Headings get id slugs and anchor links; internal links use Next.js Link.
 * Uses shared slugify from lib/slugify so IDs match extractHeadings (TOC).
 */

import { slugify } from '@/lib/slugify'
import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'

function getHeadingText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getHeadingText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    const el = children as { props: { children?: ReactNode } }
    return getHeadingText(el.props.children)
  }
  return ''
}

/** Component map for next-mdx-remote (MDXProvider components prop) */
type MDXGuideComponents = Record<string, ComponentType<Record<string, unknown>>>

export const mdxGuideComponents: MDXGuideComponents = {
  h2: ({ children, ...props }: { children?: ReactNode }) => {
    const text = getHeadingText(children)
    const id = slugify(text)
    return (
      <h2 id={id} className="text-lg font-medium text-text mb-3 mt-10 scroll-mt-24" {...props}>
        <a href={`#${id}`} className="anchor-link group flex items-center gap-2">
          <span>{children}</span>
          <span
            className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            aria-hidden
          >
            #
          </span>
        </a>
      </h2>
    )
  },
  h3: ({ children, ...props }: { children?: ReactNode }) => {
    const text = getHeadingText(children)
    const id = slugify(text)
    return (
      <h3 id={id} className="text-base font-medium text-text mb-2 mt-6 scroll-mt-24" {...props}>
        <a href={`#${id}`} className="anchor-link group flex items-center gap-2">
          <span>{children}</span>
          <span
            className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            aria-hidden
          >
            #
          </span>
        </a>
      </h3>
    )
  },
  a: ({ href, children, ...props }: { href?: string; children?: ReactNode }) => {
    const isInternal = href?.startsWith('/')
    if (isInternal && href) {
      return (
        <Link
          href={href}
          className="text-text underline underline-offset-4 decoration-dashed hover:decoration-solid"
          {...props}
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text underline underline-offset-4 decoration-dashed hover:decoration-solid"
        {...props}
      >
        {children}
      </a>
    )
  },
  p: ({ children, ...props }: { children?: ReactNode }) => (
    <p className="text-sm text-text-secondary leading-relaxed mb-3" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: { children?: ReactNode }) => (
    <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary mb-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: { children?: ReactNode }) => (
    <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: { children?: ReactNode }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: { children?: ReactNode }) => (
    <strong className="text-text font-medium" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, ...props }: { children?: ReactNode }) => (
    <code
      className="bg-surface border border-border px-1 rounded text-text-muted font-mono text-xs"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: { children?: ReactNode }) => (
    <pre
      className="bg-surface border border-border rounded-lg p-4 overflow-x-auto text-sm text-text-secondary my-4"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: { children?: ReactNode }) => (
    <blockquote
      className="border-l-2 border-border pl-4 text-text-secondary italic my-4"
      {...props}
    >
      {children}
    </blockquote>
  ),
}
