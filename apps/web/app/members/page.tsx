/**
 * Members Page - Server Component
 *
 * Full SSR with caching. Matches the browse page layout.
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import type { MemberData } from '@/components/members/member-card'
import { MembersList } from '@/components/members/members-list'
import { MembersSearch } from '@/components/members/members-search'
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo/json-ld'
import { EmptyState } from '@/components/shared/empty-state'
import { getMemberCount, getMembers } from '@/lib/convex-server'
import { createMetadata } from '@/lib/seo'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

/**
 * Generate metadata for the members page
 */
export async function generateMetadata(): Promise<Metadata> {
  const totalCount = (await getMemberCount()) ?? 0

  return createMetadata({
    title: `SOUL.md Community Members (${totalCount}) - souls.directory`,
    description: `Discover ${totalCount} creators sharing SOUL.md personality templates for OpenClaw. Browse profiles and connect with the souls.directory community.`,
    path: '/members',
    noSuffix: true,
    keywords: ['community', 'members', 'creators', 'SOUL.md creators', 'OpenClaw community'],
  })
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    sort?: 'recent' | 'active'
  }>
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const searchQuery = params.search || ''
  const page = Number.parseInt(params.page || '1', 10)
  const sort = params.sort || 'recent'
  const limit = 24

  // Fetch members with caching (returns null on Convex error)
  const membersResult = await getMembers({
    search: searchQuery || undefined,
    limit: 200, // Fetch more so we can paginate client-side from cache
    sort,
  })

  // biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
  const rawMembers: any[] = membersResult?.members ?? []
  const totalCount: number = membersResult?.totalCount ?? 0

  // Transform to MemberData type
  const allMembers: MemberData[] = rawMembers.map((member: MemberData) => ({
    _id: member._id,
    handle: member.handle,
    name: member.name,
    displayName: member.displayName,
    bio: member.bio,
    image: member.image,
    websiteUrl: member.websiteUrl,
    xHandle: member.xHandle,
    githubHandle: member.githubHandle,
    role: member.role,
    createdAt: member.createdAt,
    soulCount: member.soulCount,
  }))

  // Paginate
  const startIndex = (page - 1) * limit
  const paginatedMembers = allMembers.slice(startIndex, startIndex + limit)

  return (
    <>
      <CollectionPageSchema
        name="Community Members"
        description="Discover creators sharing SOUL.md personality templates for OpenClaw."
        url="/members"
        itemCount={totalCount}
      />
      <BreadcrumbSchema items={[{ name: 'Members', url: '/members' }]} />
      <main className="min-h-screen">
        <PageContainer>
          {/* Breadcrumb */}
          <Breadcrumb items={[{ name: 'Members' }]} className="mb-6" />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-text">Community Members</h1>
            <p className="text-sm text-text-secondary mt-1">
              {searchQuery
                ? `${allMembers.length} of ${totalCount} members found`
                : `${totalCount} creators sharing AI personas and system prompts`}
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <MembersSearch initialSearch={searchQuery} />
          </div>

          {/* Members list */}
          {paginatedMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-10 h-10" />}
              title="No members found"
              description={
                searchQuery
                  ? `No members found matching "${searchQuery}". Try a different search term.`
                  : 'Be the first to join the community!'
              }
            />
          ) : (
            <MembersList
              members={paginatedMembers}
              totalCount={allMembers.length}
              page={page}
              limit={limit}
              searchQuery={searchQuery}
            />
          )}
        </PageContainer>
      </main>
    </>
  )
}
