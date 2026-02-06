/**
 * Dynamic OG image for user profiles (1200×630).
 * Used when sharing /members/[handle] on social platforms.
 */

import { getSoulsByUser, getUserByHandle } from '@/lib/convex-server'
import { ImageResponse } from 'next/og'

export const alt = 'Profile on souls.directory'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const handle = searchParams.get('handle')

  if (!handle) {
    return new Response('Missing handle', { status: 400 })
  }

  const user = await getUserByHandle(handle)
  if (!user || user.deletedAt) {
    return new Response('Profile not found', { status: 404 })
  }

  const souls = await getSoulsByUser(user._id)
  const soulCount = souls?.length ?? 0
  const name = user.displayName || user.handle || 'User'
  const avatarUrl = user.image || null

  return new ImageResponse(
    <div
      style={{
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 48,
          maxWidth: 1000,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={200}
            height={200}
            style={{
              borderRadius: '50%',
              border: '4px solid #262626',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: '#111111',
              border: '4px solid #262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ededed',
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            {(name.charAt(0) || 'U').toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 600, color: '#ededed' }}>{name}</div>
          <div style={{ fontSize: 32, color: '#878787', fontFamily: 'ui-monospace, monospace' }}>
            @{handle}
          </div>
          <div style={{ fontSize: 28, color: '#525252' }}>
            {soulCount} {soulCount === 1 ? 'soul' : 'souls'} on souls.directory
          </div>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
