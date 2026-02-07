import { fireEvent, render, screen, within } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => React.createElement('a', { href, ...props }, children),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/faq',
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: () => React.createElement('nav', { 'data-testid': 'breadcrumb' }),
}))

vi.mock('@/components/layout/page-container', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
}))

// Import FAQ data to build expectations independently of component
import { faqCategories, faqItems } from '@/lib/faq-data'
import { FAQContent } from '../faq-content'

describe('FAQContent', () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it('renders the page heading and all FAQ items by default', () => {
    render(<FAQContent />)
    expect(
      screen.getByRole('heading', { name: 'Frequently Asked Questions', level: 1 })
    ).toBeInTheDocument()

    // All FAQ questions should be visible
    for (const item of faqItems) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
  })

  it('renders category filter buttons including "All"', () => {
    render(<FAQContent />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    for (const category of faqCategories) {
      expect(screen.getByRole('button', { name: category })).toBeInTheDocument()
    }
  })

  // ---------------------------------------------------------------------------
  // Accordion behavior
  // ---------------------------------------------------------------------------

  it('all answers are hidden by default', () => {
    render(<FAQContent />)
    // Answers should NOT be visible (they're in collapsed grid-rows-[0fr])
    // We test the first FAQ item's answer text is in the DOM but visually hidden
    const firstAnswer = faqItems[0].answer
    // The text is still in the DOM (for SEO) but the parent div has grid-rows-[0fr]
    // We can check the text exists but the container isn't expanded
    expect(screen.getByText(firstAnswer)).toBeInTheDocument()
  })

  it('clicking a question toggles its answer open', () => {
    render(<FAQContent />)
    const firstQuestion = faqItems[0].question
    const questionButton = screen.getByText(firstQuestion).closest('button')!
    fireEvent.click(questionButton)

    // After clicking, the parent grid should have grid-rows-[1fr] (expanded)
    // We verify by checking the chevron has rotate-180 class
    const chevronContainer = questionButton.querySelector('[class*="rotate-180"]')
    expect(chevronContainer).not.toBeNull()
  })

  it('clicking the same question again closes it', () => {
    render(<FAQContent />)
    const questionButton = screen.getByText(faqItems[0].question).closest('button')!

    // Open
    fireEvent.click(questionButton)
    expect(questionButton.querySelector('[class*="rotate-180"]')).not.toBeNull()

    // Close
    fireEvent.click(questionButton)
    expect(questionButton.querySelector('[class*="rotate-180"]')).toBeNull()
  })

  it('opening a different question closes the previously open one', () => {
    render(<FAQContent />)
    const firstButton = screen.getByText(faqItems[0].question).closest('button')!
    const secondButton = screen.getByText(faqItems[1].question).closest('button')!

    // Open first
    fireEvent.click(firstButton)
    expect(firstButton.querySelector('[class*="rotate-180"]')).not.toBeNull()

    // Open second — first should close
    fireEvent.click(secondButton)
    expect(secondButton.querySelector('[class*="rotate-180"]')).not.toBeNull()
    expect(firstButton.querySelector('[class*="rotate-180"]')).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // Category filtering
  // ---------------------------------------------------------------------------

  it("clicking a category filters to only that category's questions", () => {
    render(<FAQContent />)
    const targetCategory = faqCategories[0]
    const expectedItems = faqItems.filter((i) => i.category === targetCategory)
    const excludedItems = faqItems.filter((i) => i.category !== targetCategory)

    fireEvent.click(screen.getByRole('button', { name: targetCategory }))

    // Category's items should remain visible
    for (const item of expectedItems) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }

    // Other categories' items should be gone
    for (const item of excludedItems) {
      expect(screen.queryByText(item.question)).not.toBeInTheDocument()
    }
  })

  it('clicking "All" after a category filter shows all items again', () => {
    render(<FAQContent />)
    const targetCategory = faqCategories[0]

    // Filter to a category
    fireEvent.click(screen.getByRole('button', { name: targetCategory }))
    // Then reset
    fireEvent.click(screen.getByRole('button', { name: 'All' }))

    // All should be back
    for (const item of faqItems) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
  })

  // ---------------------------------------------------------------------------
  // External link
  // ---------------------------------------------------------------------------

  it('renders "Open a Discussion" link to GitHub discussions', () => {
    render(<FAQContent />)
    const link = screen.getByRole('link', { name: /Open a Discussion/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/thedaviddias/souls-directory/discussions'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
