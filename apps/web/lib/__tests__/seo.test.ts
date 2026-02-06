import { describe, expect, it } from 'vitest'
import {
  DEFAULT_KEYWORDS,
  SITE_CONFIG,
  canonicalUrl,
  createAuthPageMetadata,
  createDynamicMetadata,
  createMetadata,
  formatTitle,
} from '../seo'

describe('formatTitle', () => {
  it('appends site name when noSuffix is false', () => {
    expect(formatTitle('About')).toBe('About | souls.directory')
    expect(formatTitle('Upload')).toBe('Upload | souls.directory')
  })

  it('returns title as-is when noSuffix is true', () => {
    expect(formatTitle('Home', true)).toBe('Home')
    expect(formatTitle('souls.directory', true)).toBe('souls.directory')
  })

  it('returns title as-is when title equals SITE_CONFIG.name', () => {
    expect(formatTitle(SITE_CONFIG.name)).toBe(SITE_CONFIG.name)
  })

  it('defaults noSuffix to false', () => {
    expect(formatTitle('FAQ')).toBe('FAQ | souls.directory')
  })
})

describe('canonicalUrl', () => {
  it('prepends SITE_CONFIG.url to path', () => {
    expect(canonicalUrl('/')).toBe('https://souls.directory/')
    expect(canonicalUrl('/about')).toBe('https://souls.directory/about')
    expect(canonicalUrl('/souls/foo')).toBe('https://souls.directory/souls/foo')
  })

  it('normalizes path without leading slash', () => {
    expect(canonicalUrl('about')).toBe('https://souls.directory/about')
  })

  it('defaults to root path when no argument', () => {
    expect(canonicalUrl()).toBe('https://souls.directory/')
  })
})

describe('createMetadata', () => {
  it('returns metadata with title, description, and path', () => {
    const meta = createMetadata({
      title: 'About',
      description: 'Learn about souls.directory',
      path: '/about',
    })
    expect(meta.title).toBe('About')
    expect(meta.description).toBe('Learn about souls.directory')
    expect(meta.alternates?.canonical).toBe('https://souls.directory/about')
  })

  it('merges custom keywords with DEFAULT_KEYWORDS without duplicates', () => {
    const meta = createMetadata({
      title: 'Test',
      description: 'Test',
      keywords: ['custom', 'SOUL.md'],
    })
    const keywords = meta.keywords as string[]
    expect(keywords).toContain('custom')
    expect(keywords).toContain('SOUL.md')
    expect(keywords.filter((k) => k === 'SOUL.md')).toHaveLength(1)
    for (const def of DEFAULT_KEYWORDS) {
      expect(keywords).toContain(def)
    }
  })

  it('sets openGraph with full title, url, and image', () => {
    const meta = createMetadata({
      title: 'Page',
      description: 'Desc',
      path: '/page',
    })
    const ogImages = Array.isArray(meta.openGraph?.images)
      ? meta.openGraph.images
      : meta.openGraph?.images != null
        ? [meta.openGraph.images]
        : []
    type OGImageEntry = { url?: string; width?: number; height?: number }
    const firstImage = ogImages[0] as OGImageEntry
    expect(meta.openGraph?.title).toBe('Page | souls.directory')
    expect(meta.openGraph?.url).toBe('https://souls.directory/page')
    expect(meta.openGraph?.siteName).toBe(SITE_CONFIG.name)
    expect(ogImages).toHaveLength(1)
    expect(firstImage.url).toBe(`${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`)
    expect(firstImage.width).toBe(1200)
    expect(firstImage.height).toBe(630)
  })

  it('sets twitter card with summary_large_image and creator', () => {
    const meta = createMetadata({
      title: 'Page',
      description: 'Desc',
    })
    const twitter = meta.twitter as { card?: string; title?: string; creator?: string } | null
    expect(twitter?.card).toBe('summary_large_image')
    expect(twitter?.title).toBe('Page | souls.directory')
    expect(twitter?.creator).toBe(SITE_CONFIG.x)
  })

  it('uses absolute title when noSuffix is true', () => {
    const meta = createMetadata({
      title: 'Home',
      description: 'Welcome',
      noSuffix: true,
    })
    expect(meta.title).toEqual({ absolute: 'Home' })
    expect(meta.openGraph?.title).toBe('Home')
  })

  it('uses full URL for ogImage when it starts with http', () => {
    const meta = createMetadata({
      title: 'Page',
      description: 'Desc',
      ogImage: 'https://example.com/image.png',
    })
    const ogImages = Array.isArray(meta.openGraph?.images)
      ? meta.openGraph.images
      : meta.openGraph?.images != null
        ? [meta.openGraph.images]
        : []
    const firstImage = ogImages[0] as { url?: string }
    expect(firstImage.url).toBe('https://example.com/image.png')
    const twitter = meta.twitter as { images?: string[] } | null
    expect(twitter?.images).toContain('https://example.com/image.png')
  })

  it('adds robots noindex when noIndex is true', () => {
    const meta = createMetadata({
      title: 'Private',
      description: 'Private page',
      noIndex: true,
    })
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    })
  })

  it('supports ogType article and profile', () => {
    const openGraph = (m: ReturnType<typeof createMetadata>) =>
      m.openGraph as { type?: string } | null
    expect(
      openGraph(createMetadata({ title: 'A', description: 'B', ogType: 'article' }))?.type
    ).toBe('article')
    expect(
      openGraph(createMetadata({ title: 'A', description: 'B', ogType: 'profile' }))?.type
    ).toBe('profile')
  })

  it('defaults path to / and ogType to website', () => {
    const meta = createMetadata({ title: 'T', description: 'D' })
    expect(meta.alternates?.canonical).toBe('https://souls.directory/')
    expect((meta.openGraph as { type?: string })?.type).toBe('website')
  })
})

describe('createAuthPageMetadata', () => {
  it('returns metadata with noIndex true', () => {
    const meta = createAuthPageMetadata('Login')
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    })
  })

  it('uses default description when not provided', () => {
    const meta = createAuthPageMetadata('Settings')
    expect(meta.description).toBe(`Settings on ${SITE_CONFIG.name}`)
  })

  it('uses provided description when given', () => {
    const meta = createAuthPageMetadata('Login', 'Sign in with GitHub')
    expect(meta.description).toBe('Sign in with GitHub')
  })
})

describe('createDynamicMetadata', () => {
  it('delegates to createMetadata with same config', () => {
    const config = {
      title: 'Soul Name',
      description: 'Soul tagline',
      path: '/souls/my-soul',
    }
    const meta = createDynamicMetadata(config)
    expect(meta.title).toBe(config.title)
    expect(meta.description).toBe(config.description)
    expect(meta.alternates?.canonical).toBe('https://souls.directory/souls/my-soul')
  })
})
