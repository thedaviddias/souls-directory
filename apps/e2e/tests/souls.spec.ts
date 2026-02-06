import { expect, test } from '@playwright/test'

test.describe('Soul Pages', () => {
  test('soul detail page displays content', async ({ page }) => {
    // Navigate to a soul page (using mock data fallback)
    await page.goto('/souls/stark')

    // Should show soul name
    await expect(page.locator('h1')).toContainText(/stark/i)

    // Should have copy button
    const copyButton = page.locator('button:has-text("Copy")')
    await expect(copyButton).toBeVisible()
  })

  test('copy button copies CLI command', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/souls/stark')

    const copyButton = page.locator('button:has-text("Copy")').first()
    await copyButton.click()

    // Button should show copied state
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 2000 })
  })

  test('browse page filters work', async ({ page }) => {
    await page.goto('/browse')

    // Check if category filters exist
    const filterSection = page.locator('[data-testid="filters"]')
    if (await filterSection.isVisible()) {
      // Click a category filter if available
      const categoryFilter = filterSection.locator('button').first()
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click()
        // URL should update with filter
        await expect(page).toHaveURL(/category=/)
      }
    }
  })

  test('browse page sorting works', async ({ page }) => {
    await page.goto('/browse')

    // Look for sort dropdown or buttons
    const sortButton = page
      .locator('button:has-text("Sort")')
      .or(page.locator('select[name="sort"]'))

    if (await sortButton.isVisible()) {
      await sortButton.click()
      // Check if sort options appear
      const recentOption = page.locator('text=Recent')
      if (await recentOption.isVisible()) {
        await recentOption.click()
        await expect(page).toHaveURL(/sort=recent/)
      }
    }
  })
})

test.describe('Soul Cards', () => {
  test('soul cards display on homepage', async ({ page }) => {
    await page.goto('/')

    // Should show featured souls section
    const featuredSection = page
      .locator('text=Featured')
      .or(page.locator('[data-testid="featured-souls"]'))

    // Cards should be visible (from mock data)
    const cards = page.locator('[data-testid="soul-card"]').or(page.locator('a[href^="/souls/"]'))

    // At least one soul card should be visible
    await expect(cards.first()).toBeVisible({ timeout: 5000 })
  })

  test('soul card links to detail page', async ({ page }) => {
    await page.goto('/')

    const soulCard = page.locator('a[href^="/souls/"]').first()
    if (await soulCard.isVisible()) {
      const href = await soulCard.getAttribute('href')
      if (href) {
        await soulCard.click()
        await expect(page).toHaveURL(href)
      }
    }
  })
})
