import { SoulBuilderContent } from '@/components/create/soul-builder-content'
import { createAuthPageMetadata } from '@/lib/seo'

export const metadata = createAuthPageMetadata(
  'Create Soul',
  'Generate a first-draft SOUL.md, refine it, and continue to the upload flow.'
)

export default function CreatePage() {
  return <SoulBuilderContent />
}
