import { CategoryIcon } from '@/lib/category-icons'
import { soulsByCategoryPath } from '@/lib/routes'
import type { Category } from '@/types'
import type { Route } from 'next'
import Link from 'next/link'

interface CategoryCardProps {
  category: Category
  index?: number
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <Link
      href={soulsByCategoryPath(category.slug) as Route}
      aria-label={`Browse ${category.name} souls - ${category.description}`}
      className="
        group relative overflow-hidden rounded-lg border border-border
        bg-surface p-5
        hover:border-text-muted transition-all duration-200
        hover:-translate-y-0.5
      "
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="relative">
        {/* Icon */}
        <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3 bg-elevated text-text-secondary">
          <CategoryIcon slug={category.slug} className="w-5 h-5" />
        </div>

        {/* Name */}
        <h3 className="text-sm font-medium text-text mb-1 group-hover:text-text-secondary transition-colors">
          {category.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-muted line-clamp-2">{category.description}</p>

        {/* Arrow indicator */}
        <div className="absolute top-0 right-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-xs">
          →
        </div>
      </div>
    </Link>
  )
}
