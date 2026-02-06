import { ROUTES } from '@/lib/routes'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export interface MemberData {
  _id: string
  handle?: string | null
  name?: string | null
  displayName?: string | null
  bio?: string | null
  image?: string | null
  websiteUrl?: string | null
  xHandle?: string | null
  mastodonHandle?: string | null
  blueskyHandle?: string | null
  githubHandle?: string | null
  role?: string | null
  createdAt?: number | null
  soulCount?: number
}

/**
 * Get initials from a display name or handle
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Get display name from member data
 */
function getDisplayName(member: MemberData): string {
  return member.displayName || member.name || member.handle || 'Anonymous'
}

/**
 * Individual member card component
 *
 * Uses project design tokens for consistent styling.
 */
export function MemberCard({ member }: { member: MemberData }) {
  const displayName = getDisplayName(member)
  const initials = getInitials(displayName)
  // Use handle for the profile URL, fall back to _id (getByHandle supports both)
  const profileSlug = member.handle || member._id
  const profileUrl = ROUTES.userProfile(profileSlug)

  const joinDate = member.createdAt
    ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })
    : null

  return (
    <Link
      href={profileUrl}
      className="block rounded-lg border border-border bg-surface/50 p-4 text-center transition-colors hover:border-text-muted hover:bg-surface"
    >
      {/* Avatar */}
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border">
        {member.image ? (
          <Image
            src={member.image}
            alt={`${displayName}'s avatar`}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-text-secondary">{initials}</span>
        )}
      </div>

      {/* Name */}
      <h3 className="truncate text-sm font-medium text-text">{displayName}</h3>

      {/* Handle */}
      {member.handle && member.handle !== displayName && (
        <p className="truncate text-xs text-text-muted font-mono mt-0.5">@{member.handle}</p>
      )}

      {/* Soul count */}
      {member.soulCount !== undefined && member.soulCount > 0 && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-text-secondary font-mono">
          <FileText className="w-3 h-3" />
          {member.soulCount} {member.soulCount === 1 ? 'soul' : 'souls'}
        </p>
      )}

      {/* Join date */}
      {joinDate && (
        <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-text-muted font-mono">
          <Calendar className="w-3 h-3" />
          Joined {joinDate}
        </p>
      )}
    </Link>
  )
}
