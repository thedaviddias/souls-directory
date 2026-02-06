/**
 * Category icon component using the centralized category configuration.
 * Renders Lucide icons based on category slug.
 */

import { Code2 } from 'lucide-react'
import { getCategoryBySlug } from './categories'

interface CategoryIconProps {
  /** Category slug */
  slug: string
  /** Icon size class (e.g., "w-4 h-4") */
  className?: string
}

/**
 * Renders a Lucide icon based on category slug.
 * Falls back to Code2 icon for unknown categories.
 */
export function CategoryIcon({ slug, className = 'w-4 h-4' }: CategoryIconProps) {
  const category = getCategoryBySlug(slug)
  const Icon = category?.icon ?? Code2
  return <Icon className={className} />
}

// Re-export the getter function for cases where you need the component reference
export { getCategoryIcon } from './categories'
