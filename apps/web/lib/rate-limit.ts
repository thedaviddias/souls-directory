/**
 * Distributed rate limiter using Upstash Redis.
 * Works correctly in serverless/multi-instance environments.
 *
 * Configuration via environment variables (supports both naming conventions):
 * - Vercel KV: KV_REST_API_URL and KV_REST_API_TOKEN
 * - Upstash Direct: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *
 * Falls back to in-memory rate limiting if neither is configured.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Configuration
const WINDOW_DURATION = '60 s' // 1 minute window
const MAX_REQUESTS = 10 // 10 requests per minute (soul fetch)
const MAX_SEARCH_REQUESTS = 5 // 5 requests per minute (search API - heavier)
const MAX_LLMSTXT_REQUESTS = 30 // 30 requests per minute (llms.txt - generous for crawlers)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Get Redis URL and token - support both Vercel KV and Upstash direct naming
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

// Check if Redis is configured
const isRedisConfigured = !!(REDIS_URL && REDIS_TOKEN)

// Create Upstash rate limiter if configured
let upstashRatelimit: Ratelimit | null = null

let upstashSearchRatelimit: Ratelimit | null = null
let upstashLlmsTxtRatelimit: Ratelimit | null = null

if (isRedisConfigured) {
  const redis = new Redis({
    url: REDIS_URL,
    token: REDIS_TOKEN,
  })
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW_DURATION),
    analytics: true,
    prefix: 'souls-directory:ratelimit',
  })
  upstashSearchRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_SEARCH_REQUESTS, WINDOW_DURATION),
    analytics: true,
    prefix: 'souls-directory:ratelimit:search',
  })
  upstashLlmsTxtRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_LLMSTXT_REQUESTS, WINDOW_DURATION),
    analytics: true,
    prefix: 'souls-directory:ratelimit:llmstxt',
  })
}

// In-memory fallback for development or when Upstash is not configured
const WINDOW_MS = 60 * 1000
const inMemoryRequests = new Map<string, { count: number; resetAt: number }>()
const inMemorySearchRequests = new Map<string, { count: number; resetAt: number }>()
const inMemoryLlmsTxtRequests = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if a request from the given IP is allowed under the rate limit.
 * Uses Upstash Redis in production, falls back to in-memory for development.
 *
 * @param ip - Client IP address
 * @returns Object with allowed status, remaining requests, and reset time
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // Use Upstash if configured
  if (upstashRatelimit) {
    const result = await upstashRatelimit.limit(ip)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  }

  // Fallback to in-memory rate limiting
  return checkInMemoryRateLimit(ip)
}

/**
 * In-memory rate limiter fallback.
 * Note: Only suitable for single-instance deployments or development.
 */
function checkInMemoryRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const record = inMemoryRequests.get(ip)

  // New IP or window expired - start fresh
  if (!record || now > record.resetAt) {
    const resetAt = now + WINDOW_MS
    inMemoryRequests.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt }
  }

  // Rate limit exceeded
  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  // Increment count
  record.count++
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetAt: record.resetAt,
  }
}

/**
 * Check rate limit for the search API (5 req/min per IP).
 * Stricter than soul fetch since search is heavier.
 */
export async function checkRateLimitSearch(ip: string): Promise<RateLimitResult> {
  if (upstashSearchRatelimit) {
    const result = await upstashSearchRatelimit.limit(ip)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  }
  return checkInMemoryRateLimitWithConfig(ip, inMemorySearchRequests, MAX_SEARCH_REQUESTS)
}

/**
 * Check rate limit for the llms.txt route (30 req/min per IP).
 * Generous for legitimate bots/crawlers, limits hammering.
 */
export async function checkRateLimitLlmsTxt(ip: string): Promise<RateLimitResult> {
  if (upstashLlmsTxtRatelimit) {
    const result = await upstashLlmsTxtRatelimit.limit(ip)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  }
  return checkInMemoryRateLimitWithConfig(ip, inMemoryLlmsTxtRequests, MAX_LLMSTXT_REQUESTS)
}

function checkInMemoryRateLimitWithConfig(
  ip: string,
  store: Map<string, { count: number; resetAt: number }>,
  maxRequests: number
): RateLimitResult {
  const now = Date.now()
  const record = store.get(ip)
  if (!record || now > record.resetAt) {
    const resetAt = now + WINDOW_MS
    store.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }
  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  }
}

// Cleanup old entries periodically (in-memory fallback only)
if (typeof setInterval !== 'undefined' && !isRedisConfigured) {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of inMemoryRequests.entries()) {
      if (now > record.resetAt) {
        inMemoryRequests.delete(ip)
      }
    }
    for (const [ip, record] of inMemorySearchRequests.entries()) {
      if (now > record.resetAt) {
        inMemorySearchRequests.delete(ip)
      }
    }
    for (const [ip, record] of inMemoryLlmsTxtRequests.entries()) {
      if (now > record.resetAt) {
        inMemoryLlmsTxtRequests.delete(ip)
      }
    }
  }, WINDOW_MS)
}
