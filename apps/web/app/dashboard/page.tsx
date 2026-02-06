/**
 * Dashboard Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 */

import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { createAuthPageMetadata } from '@/lib/seo'

export const metadata = createAuthPageMetadata(
  'Dashboard',
  'Manage your AI personality templates, view stats, and track your submissions.'
)

export default function DashboardPage() {
  return <DashboardContent />
}
