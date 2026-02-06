import { NextResponse } from 'next/server'

/**
 * Standardized API response types
 */
export interface ApiSuccessResponse<T> {
  data: T
}

export interface ApiErrorResponse {
  error: string
  code: string
  details?: unknown
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status })
}

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  code: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { error: message, code }
  if (details !== undefined) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}

/**
 * Pre-built common error responses
 */
export const errors = {
  /** 400 Bad Request */
  badRequest: (message = 'Bad request', details?: unknown) =>
    apiError(message, 'BAD_REQUEST', 400, details),

  /** 401 Unauthorized */
  unauthorized: (message = 'Unauthorized') => apiError(message, 'UNAUTHORIZED', 401),

  /** 403 Forbidden */
  forbidden: (message = 'Forbidden') => apiError(message, 'FORBIDDEN', 403),

  /** 404 Not Found */
  notFound: (message = 'Resource not found') => apiError(message, 'NOT_FOUND', 404),

  /** 405 Method Not Allowed */
  methodNotAllowed: (message = 'Method not allowed') =>
    apiError(message, 'METHOD_NOT_ALLOWED', 405),

  /** 409 Conflict */
  conflict: (message = 'Resource conflict') => apiError(message, 'CONFLICT', 409),

  /** 422 Unprocessable Entity */
  unprocessable: (message = 'Unprocessable entity', details?: unknown) =>
    apiError(message, 'UNPROCESSABLE_ENTITY', 422, details),

  /** 429 Too Many Requests */
  rateLimited: (message = 'Too many requests') => apiError(message, 'RATE_LIMITED', 429),

  /** 500 Internal Server Error */
  internal: (message = 'Internal server error') => apiError(message, 'INTERNAL_ERROR', 500),

  /** 503 Service Unavailable */
  unavailable: (message = 'Service unavailable') => apiError(message, 'SERVICE_UNAVAILABLE', 503),
}
