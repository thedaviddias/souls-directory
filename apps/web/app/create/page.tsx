import { SoulBuilderContent } from '@/components/create/soul-builder-content'
import { createAuthPageMetadata } from '@/lib/seo'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

export const metadata = createAuthPageMetadata(
  'Create Soul',
  'Generate a first-draft SOUL.md, refine it, and continue to the upload flow.'
)

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center flex-col gap-3">
          <h1 className="text-xl font-medium text-text">Create a soul</h1>
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      }
    >
      <SoulBuilderContent />
    </Suspense>
  )
}
