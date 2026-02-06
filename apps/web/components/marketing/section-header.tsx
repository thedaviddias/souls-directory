/**
 * SectionHeader - Unified section header with two styles
 *
 * Use CVA variants:
 * - card: Title + optional description, "View all" link, trailing slot. Use for
 *   list/card sections (homepage Featured/Recently published, profile souls).
 * - label: Uppercase mono label only (or with optional View all). Use for
 *   content sections (soul detail About/Quick Install/SOUL.md, dashboard,
 *   settings, browse grids).
 *
 * Accessibility: Use the `as` prop for the correct heading level (default h2).
 * Each page must have exactly one h1 (e.g. homepage hero, soul name, page title).
 * Do NOT use as="h1" here when the page already has a unique h1 — use as="h2"
 * for section titles under that h1.
 */

import { type VariantProps, cva } from 'class-variance-authority'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
export type SectionHeadingLevel = (typeof HEADING_TAGS)[number]

const sectionHeaderVariants = cva('', {
  variants: {
    variant: {
      card: '',
      label: '',
    },
    spacing: {
      default: '',
      large: '',
    },
  },
  defaultVariants: {
    variant: 'card',
    spacing: 'default',
  },
})

export type SectionHeaderVariants = VariantProps<typeof sectionHeaderVariants>

interface SectionHeaderProps extends SectionHeaderVariants {
  /** Section title */
  title: string
  /** Heading level (default h2). Use h2 for section titles; never h1 if the page already has an h1. */
  as?: SectionHeadingLevel
  /** Optional description below the title (card variant only) */
  description?: string
  /** Optional link URL for "View all" */
  viewAllHref?: string
  /** Optional custom text for the view all link */
  viewAllText?: string
  /** Optional trailing content (card variant only, e.g. sort buttons) */
  trailing?: ReactNode
  /** Whether to use sticky positioning (card variant only) */
  sticky?: boolean
  /** Optional class for the root or heading (e.g. label with text-error for danger zone) */
  className?: string
}

export function SectionHeader({
  title,
  as: HeadingTag = 'h2',
  description,
  viewAllHref,
  viewAllText = 'View all',
  trailing,
  sticky = true,
  variant = 'card',
  spacing = 'default',
  className,
}: SectionHeaderProps) {
  if (variant === 'label') {
    const labelSpacing = spacing === 'large' ? 'mb-6' : 'mb-4'
    const viewAllLink = viewAllHref && (
      <Link
        href={viewAllHref as Route}
        className="text-sm text-text-secondary hover:text-text transition-colors"
      >
        {viewAllText}
      </Link>
    )
    const heading = (
      <HeadingTag
        className={cn(
          'text-sm uppercase tracking-wider text-text-secondary font-mono',
          !viewAllLink && labelSpacing,
          className
        )}
      >
        {title}
      </HeadingTag>
    )
    if (viewAllLink) {
      return (
        <div className={cn('flex items-center justify-between', labelSpacing)}>
          {heading}
          {viewAllLink}
        </div>
      )
    }
    return heading
  }

  // Card variant
  return (
    <div
      className={cn(
        sectionHeaderVariants({ variant, spacing }),
        sticky && 'sticky top-14 z-30 bg-bg/90 backdrop-blur-md border-b border-border',
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 -mx-6 px-6',
        className
      )}
    >
      <div className="space-y-1 flex-1">
        <HeadingTag className="text-sm font-medium text-text">{title}</HeadingTag>
        {description && <p className="text-xs text-text-secondary max-w-xl">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {trailing}
        {viewAllHref && (
          <Link
            href={viewAllHref as Route}
            className="group flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors"
          >
            {viewAllText}
            <svg
              className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
