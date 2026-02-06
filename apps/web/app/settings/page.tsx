/**
 * Settings Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 */

import { SettingsContent } from '@/components/settings/settings-content'
import { createAuthPageMetadata } from '@/lib/seo'

export const metadata = createAuthPageMetadata(
  'Settings',
  'Manage your profile and account settings on souls.directory.'
)

export default function SettingsPage() {
  return <SettingsContent />
}
