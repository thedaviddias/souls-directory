/**
 * Dashboard Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 */

import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { createAuthPageMetadata } from '@/lib/seo'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export const metadata = createAuthPageMetadata(
  'Dashboard',
  'Manage your AI personality templates, view stats, and track your submissions.'
)

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center flex-col gap-3">
          <h1 className="text-xl font-medium text-text">Dashboard</h1>
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
