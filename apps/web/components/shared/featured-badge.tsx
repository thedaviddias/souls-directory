/**
 * FeaturedBadge - Reusable "Featured" label for soul cards
 *
 * Consistent styling across SoulCard, profile cards, and dashboard cards.
 */

import { cn } from '@/lib/utils'

interface FeaturedBadgeProps {
  className?: string
}

export function FeaturedBadge({ className }: FeaturedBadgeProps) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded-md border border-border text-text-muted font-mono',
        className
      )}
      aria-hidden
    >
      Featured
    </span>
  )
}
