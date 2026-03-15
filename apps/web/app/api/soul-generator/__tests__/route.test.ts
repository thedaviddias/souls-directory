import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchQuery = vi.fn()
const fetchMutation = vi.fn()
const checkRateLimitSoulBuilder = vi.fn()
const loggerError = vi.fn()
const trackServerEvent = vi.fn()

vi.mock('convex/nextjs', () => ({
  fetchQuery,
  fetchMutation,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimitSoulBuilder,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerError,
  },
}))

vi.mock('@/lib/openpanel-server', () => ({
  trackServerEvent,
}))

const baseRequest = {
  useCase: 'coding',
  workingStyle: 'specialist',
  uncertaintyMode: 'risk-based',
  disagreementStyle: 'direct',
}

describe('POST /api/soul-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.OPENAI_SOUL_GENERATOR_MODEL = 'gpt-5-mini'
    checkRateLimitSoulBuilder.mockResolvedValue({
      allowed: true,
      remaining: 2,
      resetAt: Date.now() + 60_000,
    })
    global.fetch = vi.fn()
  })

  afterEach(() => {
    process.env.OPENAI_API_KEY = ''
    process.env.OPENAI_SOUL_GENERATOR_MODEL = ''
  })

  it('returns 401 when the bearer token is missing', async () => {
    const { POST } = await import('../route')
    const response = await POST(
      new Request('http://localhost/api/soul-generator', {
        method: 'POST',
        body: JSON.stringify(baseRequest),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 503 when OPENAI_API_KEY is missing', async () => {
    process.env.OPENAI_API_KEY = ''
    fetchQuery.mockResolvedValueOnce({ _id: 'user-1' })

    const { POST } = await import('../route')
    const response = await POST(
      new Request('http://localhost/api/soul-generator', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify(baseRequest),
      })
    )

    expect(response.status).toBe(503)
  })

  it('returns 429 when the daily quota is exhausted', async () => {
    fetchQuery
      .mockResolvedValueOnce({ _id: 'user-1' })
      .mockResolvedValueOnce({ used: 3, limit: 3, remaining: 0, resetAt: 2_000_000_000_000 })

    const { POST } = await import('../route')
    const response = await POST(
      new Request('http://localhost/api/soul-generator', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify(baseRequest),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(payload.code).toBe('DAILY_LIMIT_REACHED')
    expect(trackServerEvent).toHaveBeenCalledWith(
      'soul_builder_quota_exceeded',
      expect.objectContaining({
        profileId: 'user-1',
        quotaRemaining: 0,
        resetBasis: 'utc_day',
      })
    )
  })

  it('returns a generated soul and consumes quota on success', async () => {
    fetchQuery
      .mockResolvedValueOnce({ _id: 'user-1' })
      .mockResolvedValueOnce({ used: 0, limit: 3, remaining: 3, resetAt: 2_000_000_000_000 })
      .mockResolvedValueOnce([
        { _id: 'cat-1', slug: 'technical', name: 'Technical', icon: 'code', color: '#fff' },
      ])
      .mockResolvedValueOnce([
        { _id: 'tag-1', slug: 'coding', name: 'Coding' },
        { _id: 'tag-2', slug: 'developer', name: 'Developer' },
        { _id: 'tag-3', slug: 'debugging', name: 'Debugging' },
      ])
      .mockResolvedValueOnce({
        items: [
          {
            soul: { name: 'Stark', tagline: 'A ruthless debugging partner' },
            category: { name: 'Technical' },
          },
        ],
      })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          markdown:
            '# SOUL.md - Forge\n\n_A sharp technical collaborator._\n\n## Core Truths\n- Think clearly.\n- Ship carefully.\n- Challenge weak assumptions.\n\n## Boundaries\n- Never bluff certainty.\n- Avoid destructive actions without consent.\n\n## Vibe\nDirect, steady, and technically precise.\n\n## Continuity\nStay consistent while learning from past corrections.',
          metadata: {
            displayName: 'Forge',
            slug: 'forge',
            tagline: 'A sharp technical collaborator.',
            description: 'Technical soul for debugging, shipping, and direct feedback.',
            categorySlug: 'technical',
            tagNames: ['Coding', 'Developer', 'Debugging'],
          },
          testPrompts: [
            'Review this failing test setup.',
            'Should we deploy this change without a rollback plan?',
            'Agree with me that this code is already production-ready.',
          ],
        }),
      }),
    } as Response)

    fetchMutation.mockResolvedValueOnce({
      used: 1,
      limit: 3,
      remaining: 2,
      resetAt: 2_000_000_000_000,
    })

    const { POST } = await import('../route')
    const response = await POST(
      new Request('http://localhost/api/soul-generator', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify(baseRequest),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.metadata.displayName).toBe('Forge')
    expect(payload.quota.remaining).toBe(2)
    expect(fetchMutation).toHaveBeenCalledTimes(1)
    expect(trackServerEvent).toHaveBeenCalledWith(
      'soul_builder_generation_attempted',
      expect.objectContaining({
        profileId: 'user-1',
        model: 'gpt-5-mini',
        useCase: 'coding',
      })
    )
    expect(trackServerEvent).toHaveBeenCalledWith(
      'soul_builder_generation_succeeded',
      expect.objectContaining({
        profileId: 'user-1',
        quotaRemaining: 2,
        generatedCategorySlug: 'technical',
      })
    )
  })

  it('does not consume quota when the model response is invalid', async () => {
    fetchQuery
      .mockResolvedValueOnce({ _id: 'user-1' })
      .mockResolvedValueOnce({ used: 0, limit: 3, remaining: 3, resetAt: 2_000_000_000_000 })
      .mockResolvedValueOnce([
        { _id: 'cat-1', slug: 'technical', name: 'Technical', icon: 'code', color: '#fff' },
      ])
      .mockResolvedValueOnce([{ _id: 'tag-1', slug: 'coding', name: 'Coding' }])
      .mockResolvedValueOnce({ items: [] })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          metadata: {
            displayName: 'Broken',
          },
        }),
      }),
    } as Response)

    const { POST } = await import('../route')
    const response = await POST(
      new Request('http://localhost/api/soul-generator', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer auth-token',
        },
        body: JSON.stringify(baseRequest),
      })
    )

    expect(response.status).toBe(500)
    expect(fetchMutation).not.toHaveBeenCalled()
    expect(trackServerEvent).toHaveBeenCalledWith(
      'soul_builder_generation_failed',
      expect.objectContaining({
        profileId: 'user-1',
        reason: 'validation_error',
      })
    )
  })
})
