import { describe, expect, it } from 'vitest'
import { apiError, apiSuccess, errors } from '../api-response'

describe('apiSuccess', () => {
  it('returns JSON response with data and default 200', async () => {
    const res = apiSuccess({ id: '1', name: 'Test' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ data: { id: '1', name: 'Test' } })
  })

  it('accepts custom status', async () => {
    const res = apiSuccess({ created: true }, 201)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data).toEqual({ created: true })
  })
})

describe('apiError', () => {
  it('returns JSON with error and code', async () => {
    const res = apiError('Something failed', 'CUSTOM_CODE', 500)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Something failed')
    expect(json.code).toBe('CUSTOM_CODE')
    expect(json.details).toBeUndefined()
  })

  it('includes details when provided', async () => {
    const res = apiError('Invalid', 'VALIDATION', 422, { field: 'email' })
    const json = await res.json()
    expect(json.details).toEqual({ field: 'email' })
  })
})

describe('errors', () => {
  it('badRequest returns 400', async () => {
    const res = errors.badRequest('Invalid input')
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe('BAD_REQUEST')
    expect(json.error).toBe('Invalid input')
  })

  it('unauthorized returns 401', async () => {
    const res = errors.unauthorized()
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.code).toBe('UNAUTHORIZED')
  })

  it('forbidden returns 403', async () => {
    const res = errors.forbidden()
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('FORBIDDEN')
  })

  it('notFound returns 404', async () => {
    const res = errors.notFound('Soul not found')
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Soul not found')
  })

  it('methodNotAllowed returns 405', async () => {
    const res = errors.methodNotAllowed()
    expect(res.status).toBe(405)
  })

  it('conflict returns 409', async () => {
    const res = errors.conflict()
    expect(res.status).toBe(409)
  })

  it('unprocessable returns 422 with optional details', async () => {
    const res = errors.unprocessable('Validation failed', { errors: [] })
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.details).toEqual({ errors: [] })
  })

  it('rateLimited returns 429', async () => {
    const res = errors.rateLimited()
    expect(res.status).toBe(429)
  })

  it('internal returns 500', async () => {
    const res = errors.internal()
    expect(res.status).toBe(500)
  })

  it('unavailable returns 503', async () => {
    const res = errors.unavailable()
    expect(res.status).toBe(503)
  })
})
