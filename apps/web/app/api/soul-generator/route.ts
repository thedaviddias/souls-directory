import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { NextResponse } from 'next/server'
import { errors } from '@/lib/api-response'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/openpanel-server'
import { checkRateLimitSoulBuilder } from '@/lib/rate-limit'
import {
  getSoulBuilderUseCase,
  SOUL_BUILDER_DAILY_LIMIT,
  type SoulBuilderExample,
  SoulBuilderRequestSchema,
  type SoulBuilderResponse,
} from '@/lib/soul-builder'
import {
  buildSoulBuilderPrompt,
  extractOpenAIText,
  normalizeSoulBuilderResult,
  SOUL_BUILDER_OUTPUT_SCHEMA,
} from '@/lib/soul-builder-server'

const DEFAULT_MODEL = 'gpt-5-mini'

function getClientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    'Retry-After': Math.max(Math.ceil((resetAt - Date.now()) / 1000), 0).toString(),
    'X-RateLimit-Limit': SOUL_BUILDER_DAILY_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
  }
}

function toContrastExamples(payload: unknown): SoulBuilderExample[] {
  const items =
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : []

  return items
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const soul = (row as { soul?: Record<string, unknown> }).soul
      const category = (row as { category?: Record<string, unknown> | null }).category
      if (!soul || typeof soul !== 'object') return null

      const name = typeof soul.name === 'string' ? soul.name : null
      const tagline = typeof soul.tagline === 'string' ? soul.tagline : null
      if (!name || !tagline) return null

      return {
        name,
        tagline,
        category: category && typeof category.name === 'string' ? category.name : 'Uncategorized',
      }
    })
    .filter((item): item is SoulBuilderExample => item !== null)
    .slice(0, 3)
}

async function getAuthenticatedUser(token: string) {
  try {
    return await fetchQuery(api.users.me, {}, { token })
  } catch (_error) {
    return null
  }
}

function buildAnalyticsPayload(args: {
  userId: string
  model?: string
  request?: Partial<{
    useCase: string
    workingStyle: string
    uncertaintyMode: string
    disagreementStyle: string
    antiGoal: string
  }>
  quota?: Partial<{
    used: number
    remaining: number
    limit: number
    resetAt: number
  }>
  extra?: Record<string, unknown>
}) {
  return {
    profileId: args.userId,
    model: args.model,
    useCase: args.request?.useCase,
    workingStyle: args.request?.workingStyle,
    uncertaintyMode: args.request?.uncertaintyMode,
    disagreementStyle: args.request?.disagreementStyle,
    hasAntiGoal: !!args.request?.antiGoal,
    quotaUsed: args.quota?.used,
    quotaRemaining: args.quota?.remaining,
    quotaLimit: args.quota?.limit,
    resetAt: args.quota?.resetAt,
    resetBasis: 'utc_day',
    ...args.extra,
  }
}

export async function POST(request: Request) {
  const token = getBearerToken(request)
  if (!token) {
    return errors.unauthorized('Authentication required')
  }

  const user = await getAuthenticatedUser(token)
  if (!user) {
    return errors.unauthorized('Authentication required')
  }

  const ip = getClientIp(request)
  const ipRateLimit = await checkRateLimitSoulBuilder(ip)
  if (!ipRateLimit.allowed) {
    trackServerEvent(
      'soul_builder_rate_limited',
      buildAnalyticsPayload({
        userId: String(user._id),
        extra: {
          limitScope: 'ip',
          retryAfterSeconds: Math.max(Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000), 0),
        },
      })
    )
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.max(
            Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000),
            0
          ).toString(),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(ipRateLimit.resetAt / 1000).toString(),
        },
      }
    )
  }

  const openAiApiKey = process.env.OPENAI_API_KEY
  if (!openAiApiKey) {
    return errors.unavailable('Soul Builder is not configured yet.')
  }

  const body = await request.json().catch(() => null)
  const parsedBody = SoulBuilderRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    return errors.badRequest('Invalid soul builder request', parsedBody.error.flatten())
  }

  const existingQuota = await fetchQuery(api.soulBuilderUsage.getQuota, {}, { token })
  if (existingQuota.remaining <= 0) {
    trackServerEvent(
      'soul_builder_quota_exceeded',
      buildAnalyticsPayload({
        userId: String(user._id),
        request: parsedBody.data,
        quota: existingQuota,
      })
    )
    return NextResponse.json(
      { error: 'Daily soul builder limit reached.', code: 'DAILY_LIMIT_REACHED' },
      {
        status: 429,
        headers: rateLimitHeaders(existingQuota.remaining, existingQuota.resetAt),
      }
    )
  }

  const useCase = getSoulBuilderUseCase(parsedBody.data.useCase)
  const [categories, tags, relatedSouls] = await Promise.all([
    fetchQuery(api.categories.list, {}),
    fetchQuery(api.tags.list, { limit: 100 }),
    fetchQuery(api.souls.list, {
      categorySlug: useCase.categorySlug,
      sort: 'popular',
      limit: 3,
    }),
  ])

  const categorySlugs = categories.map((category) => category.slug)
  const tagNames = tags.map((tag) => tag.name)
  const contrastExamples = toContrastExamples(relatedSouls)
  const { instructions, input } = buildSoulBuilderPrompt({
    answers: parsedBody.data,
    categories: categorySlugs,
    tagNames,
    examples: contrastExamples,
  })

  const model = process.env.OPENAI_SOUL_GENERATOR_MODEL || DEFAULT_MODEL

  trackServerEvent(
    'soul_builder_generation_attempted',
    buildAnalyticsPayload({
      userId: String(user._id),
      model,
      request: parsedBody.data,
      quota: existingQuota,
      extra: {
        suggestedCategorySlug: useCase.categorySlug,
        contrastExampleCount: contrastExamples.length,
      },
    })
  )

  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'soul_builder_result',
          strict: true,
          schema: SOUL_BUILDER_OUTPUT_SCHEMA,
        },
      },
    }),
  })

  if (!openAiResponse.ok) {
    const details = await openAiResponse.text().catch(() => '')
    logger.error('Soul Builder OpenAI request failed', {
      status: openAiResponse.status,
      details,
      model,
      userId: user._id,
    })
    trackServerEvent(
      'soul_builder_generation_failed',
      buildAnalyticsPayload({
        userId: String(user._id),
        model,
        request: parsedBody.data,
        quota: existingQuota,
        extra: {
          reason: 'openai_error',
          status: openAiResponse.status,
        },
      })
    )
    return errors.internal('Soul generation failed.')
  }

  const responsePayload = await openAiResponse.json().catch(() => null)
  const rawText = extractOpenAIText(responsePayload)
  if (!rawText) {
    logger.error('Soul Builder returned empty output', {
      model,
      userId: user._id,
    })
    trackServerEvent(
      'soul_builder_generation_failed',
      buildAnalyticsPayload({
        userId: String(user._id),
        model,
        request: parsedBody.data,
        quota: existingQuota,
        extra: {
          reason: 'empty_output',
        },
      })
    )
    return errors.internal('Soul generation failed.')
  }

  try {
    const normalized = normalizeSoulBuilderResult({
      rawText,
      validCategories: categorySlugs,
      fallbackCategorySlug: useCase.categorySlug,
    })
    const updatedQuota = await fetchMutation(api.soulBuilderUsage.consume, { amount: 1 }, { token })

    const response: SoulBuilderResponse = {
      ...normalized,
      quota: {
        remaining: updatedQuota.remaining,
        resetAt: updatedQuota.resetAt,
      },
    }

    trackServerEvent(
      'soul_builder_generation_succeeded',
      buildAnalyticsPayload({
        userId: String(user._id),
        model,
        request: parsedBody.data,
        quota: updatedQuota,
        extra: {
          generatedCategorySlug: normalized.metadata.categorySlug,
          generatedTagCount: normalized.metadata.tagNames.length,
          testPromptCount: normalized.testPrompts.length,
        },
      })
    )

    return NextResponse.json(response, {
      headers: rateLimitHeaders(updatedQuota.remaining, updatedQuota.resetAt),
    })
  } catch (error) {
    logger.error('Soul Builder response validation failed', error, {
      model,
      userId: user._id,
    })
    trackServerEvent(
      'soul_builder_generation_failed',
      buildAnalyticsPayload({
        userId: String(user._id),
        model,
        request: parsedBody.data,
        quota: existingQuota,
        extra: {
          reason: 'validation_error',
        },
      })
    )
    return errors.internal('Soul generation failed.')
  }
}
