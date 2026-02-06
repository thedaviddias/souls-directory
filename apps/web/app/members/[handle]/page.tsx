/**
 * User Profile Page - Server Component
 *
 * Full SSR - user and souls data fetched at request time.
 * Canonical URL: /members/[handle]
 */

import { ProfileContent } from '@/components/profile/profile-content'
import { BreadcrumbSchema, PersonSchema } from '@/components/seo/json-ld'
import { getSoulsByUser, getUserByHandle } from '@/lib/convex-server'
import { ROUTES, profilePath } from '@/lib/routes'
import { SITE_CONFIG, createDynamicMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic'

// biome-ignore lint/suspicious/noExplicitAny: Convex untyped data
type UserSoulItem = any

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)

  if (!user) {
    return {
      title: 'User Not Found',
    }
  }

  const name = user.displayName || user.handle || 'User'

  return createDynamicMetadata({
    title: `@${handle}`,
    description: user.bio || `View ${name}'s AI personality templates on ${SITE_CONFIG.name}.`,
    path: profilePath(handle),
    ogType: 'profile',
    ogImage: `${SITE_CONFIG.url}/api/og/profile?handle=${encodeURIComponent(handle)}`,
    ogImageAlt: `${name}'s profile on ${SITE_CONFIG.name}`,
    keywords: [name, 'AI creator', 'soul author', 'personality templates'],
  })
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params

  // Fetch user data
  const user = await getUserByHandle(handle)

  if (!user) {
    notFound()
  }

  // Fetch user's souls
  const souls = await getSoulsByUser(user._id)

  // Transform data for client component
  const userData = {
    id: user._id,
    name: user.name,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    image: user.image,
    websiteUrl: user.websiteUrl,
    xHandle: user.xHandle,
    mastodonHandle: user.mastodonHandle,
    blueskyHandle: user.blueskyHandle,
    githubHandle: user.githubHandle,
    role: user.role,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
  }

  const soulsData = (souls || []).map((item: UserSoulItem) => ({
    soul: {
      id: item.soul._id,
      slug: item.soul.slug,
      ownerHandle: item.soul.ownerHandle ?? handle,
      name: item.soul.name,
      tagline: item.soul.tagline || '',
      downloads: item.soul.stats?.downloads || 0,
      stars: item.soul.stats?.stars || 0,
      upvotes: item.soul.stats?.upvotes || 0,
      featured: item.soul.featured || false,
      createdAt: item.soul.createdAt,
      updatedAt: item.soul.updatedAt,
    },
    category: item.category
      ? {
          slug: item.category.slug,
          name: item.category.name,
          color: item.category.color || '#878787',
        }
      : null,
  }))

  return (
    <>
      <PersonSchema
        name={userData.displayName || userData.handle || 'User'}
        handle={userData.handle || ''}
        bio={userData.bio}
        image={userData.image}
        websiteUrl={userData.websiteUrl}
        xHandle={userData.xHandle}
        githubHandle={userData.githubHandle}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Members', url: ROUTES.members },
          {
            name: userData.displayName || `@${userData.handle}`,
            url: profilePath(userData.handle),
          },
        ]}
      />
      <ProfileContent user={userData} souls={soulsData} />
    </>
  )
}
