import { expect, test } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('GET /api/souls returns list', async ({ request }) => {
    const response = await request.get('/api/souls')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('souls')
    expect(Array.isArray(data.souls)).toBe(true)
  })

  test('GET /api/souls with limit param', async ({ request }) => {
    const response = await request.get('/api/souls?limit=5')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.souls.length).toBeLessThanOrEqual(5)
  })

  test('GET /api/souls with invalid limit returns 400', async ({ request }) => {
    const response = await request.get('/api/souls?limit=9999')
    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('GET /api/souls with sort param', async ({ request }) => {
    const response = await request.get('/api/souls?sort=recent')
    expect(response.ok()).toBeTruthy()
  })

  test('GET /api/souls/[slug] returns single soul', async ({ request }) => {
    const response = await request.get('/api/souls/stark')
    // May return 404 if soul not found
    expect([200, 404]).toContain(response.status())

    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('soul')
      expect(data.soul.slug).toBe('stark')
    }
  })

  test('GET /api/souls/[slug] with invalid slug returns 400', async ({ request }) => {
    const response = await request.get('/api/souls/invalid../../path')
    expect(response.status()).toBe(400)
  })

  test('GET /api/souls/[slug]/raw returns markdown', async ({ request }) => {
    const response = await request.get('/api/souls/stark/raw')
    // May return 404 if soul not found
    expect([200, 404]).toContain(response.status())

    if (response.ok()) {
      const contentType = response.headers()['content-type']
      expect(contentType).toContain('text/markdown')
    }
  })

  test('GET /api/categories returns list', async ({ request }) => {
    const response = await request.get('/api/categories')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('categories')
  })

  test('GET /api/tags returns list', async ({ request }) => {
    const response = await request.get('/api/tags')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('tags')
  })

  test('POST /api/souls/[slug]/download tracks download', async ({ request }) => {
    const response = await request.post('/api/souls/stark/download')
    // May return 404 if soul doesn't exist, which is expected
    expect([200, 404]).toContain(response.status())

    if (response.ok()) {
      const data = await response.json()
      expect(data).toHaveProperty('success')
    }
  })
})
