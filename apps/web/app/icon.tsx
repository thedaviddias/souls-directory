import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

/**
 * Generates the site favicon dynamically.
 *
 * Uses a simple "S" glyph on a dark background to match
 * the dark-mode-only design of souls.directory.
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 22,
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fafafa',
        borderRadius: 6,
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
