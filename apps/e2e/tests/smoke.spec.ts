import { expect, test } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/souls\.directory/i)
  })

  test('browse page loads', async ({ page }) => {
    await page.goto('/browse')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('search input is functional', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill('stark')
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/q=stark/)
  })

  test('navigation works', async ({ page }) => {
    await page.goto('/')

    // Check header navigation
    const browseLink = page.locator('a[href="/browse"]').first()
    if (await browseLink.isVisible()) {
      await browseLink.click()
      await expect(page).toHaveURL('/browse')
    }
  })
})
