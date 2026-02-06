import { ROUTES } from '@/lib/routes'
import Link from 'next/link'

export default function ProfileNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="relative mb-8">
          <span className="text-[10rem] md:text-[14rem] font-mono font-bold text-border leading-none select-none">
            404
          </span>
        </div>

        <h1 className="text-xl font-medium text-text mb-3">Profile not found</h1>
        <p className="text-sm text-text-secondary mb-8 max-w-md mx-auto">
          This profile doesn&apos;t exist or has been removed.
        </p>

        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-surface border border-border mb-8 font-mono text-xs">
          <span className="text-text-muted">$</span>
          <span className="text-text-secondary">
            Error: EPROFILENOTFOUND - No member at this handle
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={ROUTES.members}
            className="h-9 px-5 inline-flex items-center justify-center text-sm font-bold bg-text text-bg hover:bg-text/90 rounded-md transition-all duration-200"
          >
            Browse members
          </Link>
          <Link
            href={ROUTES.home}
            className="h-9 px-5 inline-flex items-center justify-center text-sm border border-border text-text-secondary hover:text-text hover:border-text-muted rounded-md transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
