import type { Category } from '@/types'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryCard } from '../category-card'

const mockCategory: Category = {
  id: '1',
  slug: 'coding',
  name: 'Coding',
  description: 'Developer assistants for all your coding needs',
  icon: 'code',
  color: '#00ff88',
}

describe('CategoryCard', () => {
  it('renders category name', () => {
    render(<CategoryCard category={mockCategory} />)

    expect(screen.getByText('Coding')).toBeInTheDocument()
  })

  it('renders category description', () => {
    render(<CategoryCard category={mockCategory} />)

    expect(screen.getByText('Developer assistants for all your coding needs')).toBeInTheDocument()
  })

  it('renders category icon container', () => {
    const { container } = render(<CategoryCard category={mockCategory} />)

    // CategoryIcon renders an SVG from lucide-react
    const iconContainer = container.querySelector('.w-10.h-10')
    expect(iconContainer).toBeInTheDocument()
    // Check that an SVG icon is rendered
    const svgIcon = iconContainer?.querySelector('svg')
    expect(svgIcon).toBeInTheDocument()
  })

  it('links to souls page with category filter', () => {
    render(<CategoryCard category={mockCategory} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/souls?category=coding')
  }, 12000)

  it('renders arrow indicator', () => {
    render(<CategoryCard category={mockCategory} />)

    // Arrow is now rendered as text
    expect(screen.getByText('→')).toBeInTheDocument()
  })
})
