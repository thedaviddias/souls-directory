import { profilePath } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  BreadcrumbSchema,
  CollectionPageSchema,
  CreativeWorkSchema,
  FAQSchema,
  OrganizationSchema,
  PersonSchema,
  SoulSchema,
  WebSiteSchema,
} from '../json-ld'

function getJsonLdFromContainer(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]')
  if (!script?.textContent) throw new Error('No JSON-LD script found')
  return JSON.parse(script.textContent) as Record<string, unknown>
}

describe('WebSiteSchema', () => {
  it('outputs valid WebSite schema with SearchAction', () => {
    const { container } = render(<WebSiteSchema />)
    const schema = getJsonLdFromContainer(container)
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebSite')
    expect(schema.name).toBe(SITE_CONFIG.name)
    expect(schema.url).toBe(SITE_CONFIG.url)
    expect(schema.description).toBe(SITE_CONFIG.description)
    expect(schema.potentialAction).toEqual({
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/souls?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    })
  })

  it('includes SoftwareApplication about with applicationCategory, operatingSystem, and offers', () => {
    const { container } = render(<WebSiteSchema />)
    const schema = getJsonLdFromContainer(container)
    const about = schema.about as Record<string, unknown>
    expect(about).toBeDefined()
    expect(about['@type']).toBe('SoftwareApplication')
    expect(about.name).toBe('OpenClaw')
    expect(about.url).toBe('https://openclaw.ai')
    expect(about.applicationCategory).toBe('AI Agent Platform')
    expect(about.operatingSystem).toBe('Web')
    expect(about.offers).toEqual({
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    })
  })
})

describe('OrganizationSchema', () => {
  it('outputs valid Organization schema with sameAs', () => {
    const { container } = render(<OrganizationSchema />)
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe(SITE_CONFIG.name)
    expect(schema.logo).toBe(`${SITE_CONFIG.url}/icon-512.png`)
    expect(schema.sameAs).toEqual([
      SITE_CONFIG.socials.github,
      SITE_CONFIG.socials.x,
      SITE_CONFIG.socials.linkedin,
      SITE_CONFIG.socials.youtube,
    ])
  })
})

describe('BreadcrumbSchema', () => {
  it('outputs BreadcrumbList with Home and items', () => {
    const { container } = render(
      <BreadcrumbSchema
        items={[
          { name: 'Souls', url: '/souls' },
          { name: 'Stark', url: '/souls/stark' },
        ]}
      />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('BreadcrumbList')
    const items = schema.itemListElement as Array<{ position: number; name: string; item: string }>
    expect(items).toHaveLength(3)
    expect(items[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_CONFIG.url,
    })
    expect(items[1].name).toBe('Souls')
    expect(items[1].item).toBe(`${SITE_CONFIG.url}/souls`)
    expect(items[2].name).toBe('Stark')
    expect(items[2].item).toBe(`${SITE_CONFIG.url}/souls/stark`)
  })

  it('keeps absolute URLs as-is', () => {
    const { container } = render(
      <BreadcrumbSchema items={[{ name: 'External', url: 'https://example.com/page' }]} />
    )
    const schema = getJsonLdFromContainer(container)
    const items = schema.itemListElement as Array<{ item: string }>
    expect(items[1].item).toBe('https://example.com/page')
  })
})

describe('SoulSchema', () => {
  const baseProps = {
    name: 'Stark',
    tagline: 'Sharp wit',
    slug: 'stark',
    downloads: 100,
    stars: 50,
    createdAt: 1_000_000_000_000,
    updatedAt: 1_100_000_000_000,
  }

  it('outputs SoftwareSourceCode with required fields', () => {
    const { container } = render(<SoulSchema {...baseProps} />)
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('SoftwareSourceCode')
    expect(schema.name).toBe('Stark')
    expect(schema.description).toBe('Sharp wit')
    expect(schema.url).toBe(`${SITE_CONFIG.url}/souls/stark`)
    expect(schema.programmingLanguage).toBe('Markdown')
    expect(schema.runtimePlatform).toBe('OpenClaw')
    expect(schema.interactionStatistic).toHaveLength(2)
    expect(schema.isAccessibleForFree).toBe(true)
  })

  it('adds author when authorName provided', () => {
    const { container } = render(
      <SoulSchema {...baseProps} authorName="Jane" authorHandle="jane" />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema.author).toEqual({
      '@type': 'Person',
      name: 'Jane',
      url: `${SITE_CONFIG.url}${profilePath('jane')}`,
    })
  })

  it('adds genre when categoryName provided', () => {
    const { container } = render(<SoulSchema {...baseProps} categoryName="Coding" />)
    const schema = getJsonLdFromContainer(container)
    expect(schema.genre).toBe('Coding')
  })

  it('adds isRelatedTo when relatedSlugs provided', () => {
    const { container } = render(<SoulSchema {...baseProps} relatedSlugs={['other-soul']} />)
    const schema = getJsonLdFromContainer(container)
    expect(schema.isRelatedTo).toEqual([
      { '@type': 'CreativeWork', url: `${SITE_CONFIG.url}/souls/other-soul` },
    ])
  })
})

describe('CreativeWorkSchema', () => {
  const baseProps = {
    name: 'Stark',
    tagline: 'Sharp wit',
    slug: 'stark',
    downloads: 0,
    stars: 0,
    createdAt: 0,
    updatedAt: 0,
  }

  it('outputs CreativeWork with keywords', () => {
    const { container } = render(<CreativeWorkSchema {...baseProps} categoryName="Coding" />)
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('CreativeWork')
    expect(schema.keywords).toContain('SOUL.md')
    expect(schema.keywords).toContain('Coding')
  })
})

describe('PersonSchema', () => {
  it('outputs Person with mainEntityOfPage', () => {
    const { container } = render(
      <PersonSchema
        name="Jane"
        handle="jane"
        bio="Developer"
        image="https://example.com/avatar.png"
      />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('Person')
    expect(schema.name).toBe('Jane')
    expect(schema.url).toBe(`${SITE_CONFIG.url}${profilePath('jane')}`)
    expect(schema.description).toBe('Developer')
    expect(schema.image).toBe('https://example.com/avatar.png')
    expect(schema.mainEntityOfPage).toEqual({
      '@type': 'ProfilePage',
      '@id': `${SITE_CONFIG.url}${profilePath('jane')}`,
    })
  })

  it('adds sameAs for website, x, github', () => {
    const { container } = render(
      <PersonSchema
        name="Jane"
        handle="jane"
        websiteUrl="https://jane.com"
        xHandle="jane"
        githubHandle="jane"
      />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema.sameAs).toEqual([
      'https://jane.com',
      'https://x.com/jane',
      'https://github.com/jane',
    ])
  })
})

describe('FAQSchema', () => {
  it('outputs FAQPage with questions and answers', () => {
    const { container } = render(
      <FAQSchema items={[{ question: 'What is SOUL.md?', answer: 'A personality template.' }]} />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('FAQPage')
    const main = schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>
    expect(main).toHaveLength(1)
    expect(main[0].name).toBe('What is SOUL.md?')
    expect(main[0].acceptedAnswer.text).toBe('A personality template.')
  })
})

describe('CollectionPageSchema', () => {
  it('outputs CollectionPage with isPartOf', () => {
    const { container } = render(
      <CollectionPageSchema
        name="Browse Souls"
        description="All souls"
        url="/souls"
        itemCount={42}
      />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema['@type']).toBe('CollectionPage')
    expect(schema.name).toBe('Browse Souls')
    expect(schema.url).toBe(`${SITE_CONFIG.url}/souls`)
    expect(schema.numberOfItems).toBe(42)
    expect(schema.isPartOf).toEqual({
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    })
  })

  it('keeps absolute URL as-is', () => {
    const { container } = render(
      <CollectionPageSchema
        name="External"
        description="Desc"
        url="https://example.com/collection"
      />
    )
    const schema = getJsonLdFromContainer(container)
    expect(schema.url).toBe('https://example.com/collection')
  })
})
