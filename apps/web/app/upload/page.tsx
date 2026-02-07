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
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export const metadata = createAuthPageMetadata(
  'Upload Soul',
  'Upload or import your AI personality template to share with the community.'
)

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center flex-col gap-3">
          <h1 className="text-xl font-medium text-text">Upload Soul</h1>
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  )
}
