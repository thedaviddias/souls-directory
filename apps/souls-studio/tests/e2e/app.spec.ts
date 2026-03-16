import { expect, test } from '@playwright/test'

test('opens community souls by default', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Community' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'My Souls' })).toBeVisible()
})
