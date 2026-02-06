import { ROUTES, soulsByCategoryPath } from '@/lib/routes'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        {/* Large 404 */}
        <div className="relative mb-8">
          <span className="text-[10rem] md:text-[14rem] font-mono font-bold text-border leading-none select-none">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-xl font-medium text-text mb-3">Soul Not Found</h1>
        <p className="text-sm text-text-secondary mb-8 max-w-md mx-auto">
          This page has either ascended to a higher plane or never existed in the first place.
        </p>

        {/* CLI joke */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-surface border border-border mb-8 font-mono text-xs">
          <span className="text-text-muted">$</span>
          <span className="text-text-secondary">Error: ESOULNOTFOUND - No soul at this path</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={ROUTES.home}
            className="h-9 px-5 inline-flex items-center justify-center text-sm font-bold bg-text text-bg hover:bg-text/90 rounded-md transition-all duration-200"
          >
            Go Home
          </Link>
          <Link
            href={ROUTES.souls}
            className="h-9 px-5 inline-flex items-center justify-center text-sm border border-border text-text-secondary hover:text-text hover:border-text-muted rounded-md transition-colors"
          >
            Browse Souls
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-text-muted mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Professional', href: soulsByCategoryPath('professional') },
              { label: 'Creative', href: soulsByCategoryPath('creative') },
              { label: 'Technical', href: soulsByCategoryPath('technical') },
              { label: 'Playful', href: soulsByCategoryPath('playful') },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="px-3 py-1 rounded-md text-xs border border-border text-text-secondary hover:text-text hover:border-text-muted transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
