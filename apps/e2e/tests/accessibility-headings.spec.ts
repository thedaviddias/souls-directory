import { expect, test } from '@playwright/test'

/**
 * Accessibility: heading hierarchy
 * - Each page must have exactly one h1
 * - Headings must not skip levels (e.g. h1 then h4)
 */
function assertHeadingOrder(headings: { level: number }[]): { ok: boolean; message: string } {
  if (headings.length === 0) return { ok: true, message: 'No headings' }

  const levels = headings.map((h) => h.level)
  const h1Count = levels.filter((l) => l === 1).length
  if (h1Count === 0) return { ok: false, message: 'Missing h1' }
  if (h1Count > 1) return { ok: false, message: `Multiple h1 (${h1Count})` }

  let prev = 0
  for (const level of levels) {
    if (level - prev > 1) {
      return { ok: false, message: `Skipped level: ${prev} -> ${level}` }
    }
    prev = level
  }
  return { ok: true, message: 'OK' }
}

test.describe('Accessibility — heading order', () => {
  const publicRoutes = [
    { path: '/', name: 'Home' },
    { path: '/souls', name: 'Browse Souls' },
    { path: '/about', name: 'About' },
    { path: '/faq', name: 'FAQ' },
    { path: '/members', name: 'Members' },
    { path: '/login', name: 'Login' },
  ]

  for (const { path, name } of publicRoutes) {
    test(`${name} (${path}) has valid heading order`, async ({ page }) => {
      await page.goto(path)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((els) =>
        els.map((el) => ({
          level: Number.parseInt(el.tagName.slice(1), 10),
          text: (el.textContent ?? '').slice(0, 50),
        }))
      )
      const result = assertHeadingOrder(headings.map((h) => ({ level: h.level })))
      expect(result.ok, `${path}: ${result.message}. Headings: ${JSON.stringify(headings)}`).toBe(
        true
      )
    })
  }
})
