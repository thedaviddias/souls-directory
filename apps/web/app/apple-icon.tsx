import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

/**
 * Apple Touch Icon for iOS home screen bookmarks.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 120,
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fafafa',
        borderRadius: 36,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
      }}
    >
      S
    </div>,
    {
      ...size,
    }
  )
}
