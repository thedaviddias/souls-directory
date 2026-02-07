import { describe, expect, it } from 'vitest'
import {
  EXTERNAL_LINKS,
  ROUTES,
  browseCategoryPath,
  browseSearchPath,
  collectionPath,
  getSoulHandle,
  guidePath,
  profilePath,
  soulPath,
  soulPathFrom,
  soulsByCategoryPath,
  soulsByTagPath,
  soulsFeaturedPath,
  soulsSearchPath,
  soulsSortPath,
} from '../routes'

describe('ROUTES', () => {
  it('exposes static routes', () => {
    expect(ROUTES.home).toBe('/')
    expect(ROUTES.souls).toBe('/souls')
    expect(ROUTES.about).toBe('/about')
    expect(ROUTES.faq).toBe('/faq')
    expect(ROUTES.login).toBe('/login')
    expect(ROUTES.dashboard).toBe('/dashboard')
    expect(ROUTES.upload).toBe('/upload')
    expect(ROUTES.settings).toBe('/settings')
    expect(ROUTES.members).toBe('/members')
    expect(ROUTES.feed).toBe('/feed')
  })

  it('soulDetail builds handle-scoped path', () => {
    expect(ROUTES.soulDetail('jane', 'my-soul')).toBe('/souls/jane/my-soul')
  })

  it('userProfile uses profile path', () => {
    expect(ROUTES.userProfile('jane')).toBe('/members/jane')
  })

  it('uploadEdit encodes handle and slug', () => {
    expect(ROUTES.uploadEdit('jane', 'my-soul')).toBe('/upload?handle=jane&slug=my-soul')
  })
})

describe('soulPath', () => {
  it('returns /souls/{handle}/{slug}', () => {
    expect(soulPath('jane', 'my-soul')).toBe('/souls/jane/my-soul')
  })
})

describe('profilePath', () => {
  it('returns /members/{handle}', () => {
    expect(profilePath('jane')).toBe('/members/jane')
  })
})

describe('getSoulHandle', () => {
  it('prefers owner.handle over soul.ownerHandle', () => {
    expect(getSoulHandle({ ownerHandle: 'soul-owner' }, { handle: 'user-handle' })).toBe(
      'user-handle'
    )
  })

  it('falls back to soul.ownerHandle when owner is null', () => {
    expect(getSoulHandle({ ownerHandle: 'soul-owner' }, null)).toBe('soul-owner')
  })

  it('returns empty string when both missing', () => {
    expect(getSoulHandle({}, null)).toBe('')
  })
})

describe('soulPathFrom', () => {
  it('builds path from soul and owner', () => {
    expect(soulPathFrom({ ownerHandle: null, slug: 'my-soul' }, { handle: 'jane' })).toBe(
      '/souls/jane/my-soul'
    )
  })

  it('uses soul.ownerHandle when owner not provided', () => {
    expect(soulPathFrom({ ownerHandle: 'bob', slug: 'soul' }, undefined)).toBe('/souls/bob/soul')
  })
})

describe('collectionPath', () => {
  it('returns /collections/{slug}', () => {
    expect(collectionPath('my-list')).toBe('/collections/my-list')
  })
})

describe('guidePath', () => {
  it('returns /guides/{slug}', () => {
    expect(guidePath('getting-started')).toBe('/guides/getting-started')
  })
})

describe('browseSearchPath', () => {
  it('encodes query', () => {
    expect(browseSearchPath('hello world')).toBe('/browse?q=hello%20world')
  })
})

describe('browseCategoryPath', () => {
  it('returns browse with category param', () => {
    expect(browseCategoryPath('technical')).toBe('/browse?category=technical')
  })
})

describe('soulsByCategoryPath', () => {
  it('returns souls with category param', () => {
    expect(soulsByCategoryPath('creative')).toBe('/souls?category=creative')
  })
})

describe('soulsByTagPath', () => {
  it('returns souls with tag param', () => {
    expect(soulsByTagPath('coding')).toBe('/souls?tag=coding')
  })
})

describe('soulsSearchPath', () => {
  it('encodes query', () => {
    expect(soulsSearchPath('agent')).toBe('/souls?q=agent')
  })
})

describe('soulsSortPath', () => {
  it('returns souls with sort param', () => {
    expect(soulsSortPath('newest')).toBe('/souls?sort=newest')
  })
})

describe('soulsFeaturedPath', () => {
  it('returns souls with featured=true', () => {
    expect(soulsFeaturedPath()).toBe('/souls?featured=true')
  })
})

describe('EXTERNAL_LINKS', () => {
  it('exposes social links', () => {
    expect(EXTERNAL_LINKS.github).toBeDefined()
    expect(EXTERNAL_LINKS.x).toBeDefined()
    expect(EXTERNAL_LINKS.linkedin).toBeDefined()
    expect(EXTERNAL_LINKS.youtube).toBeDefined()
  })
})
