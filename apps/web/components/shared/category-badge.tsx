/**
 * CategoryBadge - Shared category display with icon and name
 *
 * Neutral styling (border, no category color). Use everywhere we show a category:
 * SoulCard, soul detail, browse filters. Optional link or button (onClick).
 */

import { CategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import { type VariantProps, cva } from 'class-variance-authority'
import type { Route } from 'next'
import Link from 'next/link'

const categoryBadgeVariants = cva(
  'inline-flex items-center font-medium transition-colors text-text-secondary hover:text-text',
  {
    variants: {
      variant: {
        default: 'rounded-md border border-border hover:border-text-muted',
        minimal: '',
      },
      size: {
        sm: 'text-xs gap-1.5',
        md: 'text-sm gap-2',
      },
      selected: {
        true: 'bg-surface border-text-secondary text-text',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'default', size: 'sm', class: 'px-2 py-0.5' },
      { variant: 'default', size: 'md', class: 'px-2.5 py-1' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      selected: false,
    },
  }
)

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
} as const

export type CategoryBadgeVariants = VariantProps<typeof categoryBadgeVariants>

interface CategoryBadgeProps extends CategoryBadgeVariants {
  category: Pick<Category, 'slug' | 'name'>
  href?: string
  onClick?: () => void
  className?: string
}

export function CategoryBadge({
  category,
  size = 'sm',
  variant = 'default',
  selected = false,
  href,
  onClick,
  className,
}: CategoryBadgeProps) {
  const rootClass = cn(categoryBadgeVariants({ variant, size, selected }), className)
  const iconClass = `shrink-0 ${iconSizeClasses[size ?? 'sm']}`

  if (href) {
    return (
      <Link href={href as Route} className={rootClass}>
        <CategoryIcon slug={category.slug} className={iconClass} />
        <span>{category.name}</span>
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rootClass}>
        <CategoryIcon slug={category.slug} className={iconClass} />
        <span>{category.name}</span>
      </button>
    )
  }

  return (
    <span className={rootClass}>
      <CategoryIcon slug={category.slug} className={iconClass} />
      <span>{category.name}</span>
    </span>
  )
}
