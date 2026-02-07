import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Breadcrumb, generateBreadcrumbItems } from '../breadcrumb'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) => createElement('a', { href, ...props }, children),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Breadcrumb', () => {
  it('prepends Home and renders items', () => {
    const { container } = render(
      <Breadcrumb items={[{ name: 'Souls', href: '/souls' }, { name: 'My Soul' }]} />
    )
    const nav = container.querySelector('nav[aria-label="Breadcrumb"]')
    expect(nav).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Souls')).toBeInTheDocument()
    expect(screen.getByText('My Soul')).toBeInTheDocument()
    const homeLink = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/')
    expect(homeLink).toBeInTheDocument()
    const soulsLink = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/souls')
    expect(soulsLink).toBeInTheDocument()
  })

  it('outputs JSON-LD script', () => {
    const { container } = render(<Breadcrumb items={[{ name: 'About', href: '/about' }]} />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBeGreaterThanOrEqual(1)
    const data = JSON.parse(scripts[0]?.textContent ?? '{}')
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toHaveLength(2)
    expect(data.itemListElement[0].name).toBe('Home')
    expect(data.itemListElement[1].name).toBe('About')
  })
})

describe('generateBreadcrumbItems', () => {
  it('builds items from pathname segments', () => {
    const items = generateBreadcrumbItems('/souls/my-soul')
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ name: 'Souls', href: '/souls' })
    expect(items[1]).toEqual({ name: 'My Soul', href: undefined })
  })

  it('uses labelMap when provided', () => {
    const items = generateBreadcrumbItems('/souls/technical-writer', {
      'technical-writer': 'Technical Writer',
    })
    expect(items[1].name).toBe('Technical Writer')
  })

  it('capitalizes hyphenated segments when not in map', () => {
    const items = generateBreadcrumbItems('/guides/getting-started')
    expect(items[1].name).toBe('Getting Started')
  })
})
