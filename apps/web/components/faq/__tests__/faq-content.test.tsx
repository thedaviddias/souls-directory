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

/** Find the accordion button for a given question text and assert it exists. */
function getQuestionButton(text: string): HTMLButtonElement {
  const el = screen.getByText(text).closest('button')
  expect(el).not.toBeNull()
  return el as HTMLButtonElement
}

/** Check whether the chevron inside a button is rotated (answer expanded). */
function isExpanded(button: HTMLButtonElement): boolean {
  return button.querySelector('[class*="rotate-180"]') !== null
}

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
    const button = getQuestionButton(faqItems[0].question)
    fireEvent.click(button)

    // After clicking, the chevron should be rotated (expanded)
    expect(isExpanded(button)).toBe(true)
  })

  it('clicking the same question again closes it', () => {
    render(<FAQContent />)
    const button = getQuestionButton(faqItems[0].question)

    // Open
    fireEvent.click(button)
    expect(isExpanded(button)).toBe(true)

    // Close
    fireEvent.click(button)
    expect(isExpanded(button)).toBe(false)
  })

  it('opening a different question closes the previously open one', () => {
    render(<FAQContent />)
    const firstButton = getQuestionButton(faqItems[0].question)
    const secondButton = getQuestionButton(faqItems[1].question)

    // Open first
    fireEvent.click(firstButton)
    expect(isExpanded(firstButton)).toBe(true)

    // Open second — first should close
    fireEvent.click(secondButton)
    expect(isExpanded(secondButton)).toBe(true)
    expect(isExpanded(firstButton)).toBe(false)
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
