/**
 * Soul Showcases Page - all tweet showcases with pagination.
 * URL: /souls/{handle}/{slug}/showcases
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SoulShowcases } from '@/components/souls/soul-showcases'
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
    title: `Showcases for ${name}`,
    description: `Tweet showcases and conversations for ${name} - SOUL.md template`,
    path: `/souls/${handle}/${slug}/showcases`,
  })
}

export default async function SoulShowcasesPage({ params }: PageProps) {
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
    { name: 'Showcases', href: `/souls/${ownerHandle}/${slug}/showcases` },
  ]

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />
      <h1 className="mb-2 text-2xl font-semibold text-text">
        Showcases for{' '}
        <Link href={soulPathFrom(soul, soulData.owner)} className="hover:underline">
          {soulName}
        </Link>
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        Tweet screenshots and conversations shared by people who tried this soul.
      </p>
      <SoulShowcases
        soulId={soulId}
        soulSlug={slug}
        ownerHandle={ownerHandle}
        soulOwnerId={soulData.owner?._id as Id<'users'> | undefined}
        mode="full"
      />
    </PageContainer>
  )
}
