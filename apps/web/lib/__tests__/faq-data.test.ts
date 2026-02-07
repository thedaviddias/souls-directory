import { describe, expect, it } from 'vitest'
import { type FAQItem, faqItems } from '../faq-data'

describe('faqItems', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(faqItems)).toBe(true)
    expect(faqItems.length).toBeGreaterThan(0)
  })

  it('each item has question, answer, and category', () => {
    for (const item of faqItems) {
      expect(item).toMatchObject({
        question: expect.any(String),
        answer: expect.any(String),
        category: expect.any(String),
      })
      expect(item.question.length).toBeGreaterThan(0)
      expect(item.answer.length).toBeGreaterThan(0)
      expect(item.category.length).toBeGreaterThan(0)
    }
  })

  it('includes expected FAQ entries', () => {
    const questions = faqItems.map((i: FAQItem) => i.question)
    expect(questions).toContain('What is souls.directory?')
    expect(questions).toContain('What is a SOUL.md file?')
    expect(questions).toContain('How do I use a soul?')
  })
})
