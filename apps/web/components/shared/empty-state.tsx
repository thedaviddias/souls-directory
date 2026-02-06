import { ExternalLink, Search } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href: string
    external?: boolean
  }
  secondaryAction?: {
    label: string
    href: string
    external?: boolean
  }
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6">
      {/* Icon */}
      <div className="mb-6 flex justify-center text-text-muted">
        {icon || <Search className="w-10 h-10" />}
      </div>

      {/* Title */}
      <h3 className="text-base font-medium text-text mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-text-secondary mb-8 max-w-md mx-auto">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <Link
              href={action.href as Route}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              className="px-4 py-2 rounded-md border border-border text-sm text-text hover:border-text-secondary transition-colors inline-flex items-center gap-2"
            >
              {action.label}
              {action.external && <ExternalLink className="w-3 h-3" />}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href as Route}
              target={secondaryAction.external ? '_blank' : undefined}
              rel={secondaryAction.external ? 'noopener noreferrer' : undefined}
              className="px-4 py-2 rounded-md text-sm text-text-secondary hover:text-text transition-colors inline-flex items-center gap-2"
            >
              {secondaryAction.label}
              {secondaryAction.external && <ExternalLink className="w-3 h-3" />}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
