/**
 * SoulCard - Minimalist card component for displaying a soul
 *
 * Design: Typography-first, grayscale palette inspired by cursor.directory
 * - Subtle hover-lift effect
 * - Monospace for metadata (downloads, upvotes, date)
 * - Text-only category (no colored badges)
 */

'use client'

import { CategoryBadge } from '@/components/shared/category-badge'
import { FeaturedBadge } from '@/components/shared/featured-badge'
import { ModelBadges } from '@/components/shared/model-badge'
import { soulPathFrom } from '@/lib/routes'
import type { Soul } from '@/types'
import { format } from 'date-fns'
import { ArrowUp } from 'lucide-react'
import Link from 'next/link'

interface SoulCardProps {
  soul: Soul
  featured?: boolean
  /** When true, show updated date in stats instead of "New" when downloads is 0 */
  showUpdatedDate?: boolean
}

export function SoulCard({ soul, featured = false, showUpdatedDate = false }: SoulCardProps) {
  const upvotes = soul.upvotes ?? 0
  const updatedDate =
    showUpdatedDate && soul.updated_at ? format(new Date(soul.updated_at), 'MMM d, yyyy') : null

  return (
    <div>
      <Link
        href={soulPathFrom(soul)}
        data-soul-card
        aria-label={`View ${soul.name} - ${soul.tagline}`}
        className={`
          group/card block relative overflow-hidden rounded-lg border
          transition-all duration-300 ease-out
          hover:-translate-y-0.5 hover:border-text-secondary
          bg-surface border-border
          ${featured ? 'border-text-muted' : ''}
        `}
      >
        {featured && (
          <span className="absolute top-3 right-3">
            <FeaturedBadge />
          </span>
        )}
        <div className="p-5 flex flex-col h-full">
          {/* Name and tagline */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text group-hover/card:text-text-secondary transition-colors duration-200">
              {soul.name}
            </h3>
            <p className="text-sm text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
              {soul.tagline || soul.description}
            </p>
          </div>

          {/* Category and model badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {soul.category && <CategoryBadge category={soul.category} size="sm" />}
            {soul.tested_with?.length ? (
              <ModelBadges models={soul.tested_with} className="shrink-0" />
            ) : null}
          </div>

          {/* Stats footer - monospace */}
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-3 text-xs text-text-muted font-mono">
            {updatedDate ? (
              <span>
                Updated {updatedDate}
                {soul.versions != null && soul.versions > 0 && (
                  <>
                    {' '}
                    · {soul.versions} version{soul.versions !== 1 ? 's' : ''}
                  </>
                )}
              </span>
            ) : soul.downloads > 0 ? (
              <span>{soul.downloads.toLocaleString()} downloads</span>
            ) : (
              <span className="text-success font-sans font-medium">New</span>
            )}
            {upvotes > 0 && (
              <span className="flex items-center gap-0.5">
                <ArrowUp className="w-3 h-3" />
                {upvotes.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
