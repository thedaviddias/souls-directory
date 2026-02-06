/**
 * Upload Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Auth-required page - marked as noindex.
 *
 * IMPORTANT: The upload wizard logic is in UploadContent component.
 * See CLAUDE.md for warnings about modifying upload functionality.
 */

import { UploadContent } from '@/components/upload/upload-content'
import { createAuthPageMetadata } from '@/lib/seo'
import { Suspense } from 'react'

export const metadata = createAuthPageMetadata(
  'Upload Soul',
  'Upload or import your AI personality template to share with the community.'
)

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  )
}
