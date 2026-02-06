/**
 * Soul Comments Page - full comment thread with pagination.
 * URL: /souls/{handle}/{slug}/comments
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SoulComments } from '@/components/souls/soul-comments'
import type { Id } from '@/convex/_generated/dataModel'
import { getSoulByOwnerAndSlug } from '@/lib/convex-server'
import { soulPath, soulPathFrom } from '@/lib/routes'
import { createDynamicMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ handle: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle, slug } = await params
  const soulData = await getSoulByOwnerAndSlug(handle, slug)
  const name = soulData?.soul?.name ?? slug
  return createDynamicMetadata({
    title: `Comments on ${name}`,
    description: `All comments on ${name} - SOUL.md template`,
    path: `/souls/${handle}/${slug}/comments`,
  })
}

export default async function SoulCommentsPage({ params }: PageProps) {
  const { handle, slug } = await params
  const soulData = await getSoulByOwnerAndSlug(handle, slug)

  if (!soulData?.soul) {
    notFound()
  }

  const soul = soulData.soul
  const soulId = soul._id as Id<'souls'>
  const soulName = soul.name
  const ownerHandle = soul.ownerHandle ?? soulData.owner?.handle ?? handle

  const breadcrumbItems = [
    { name: soulName, href: soulPath(ownerHandle, slug) },
    { name: 'Comments', href: `/souls/${ownerHandle}/${slug}/comments` },
  ]

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />
      <h1 className="mb-2 text-2xl font-semibold text-text">
        Comments on{' '}
        <Link href={soulPathFrom(soul, soulData.owner)} className="hover:underline">
          {soulName}
        </Link>
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        All comments for this soul. You can add a comment on the soul page.
      </p>
      <SoulComments soulId={soulId} soulSlug={slug} mode="full" />
    </PageContainer>
  )
}
