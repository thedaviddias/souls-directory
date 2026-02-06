import * as Sentry from '@sentry/nextjs'

/**
 * Centralized logging utility for souls.directory
 *
 * Provides a unified interface for logging that:
 * - Wraps console methods for consistent formatting
 * - Integrates with Sentry for warn/error levels
 * - Suppresses debug/info logs in production
 * - Adds structured context to all logs
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger'
 *
 * logger.debug('Debugging info', { userId: '123' })  // Dev only
 * logger.info('User action', { action: 'upload' })   // Dev only
 * logger.warn('Rate limit approaching', { count: 95 }) // Console + Sentry breadcrumb
 * logger.error('Upload failed', error, { fileId })     // Console + Sentry error
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Format a log message with optional context
 */
function formatMessage(message: string, context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return message
  }
  return `${message} ${JSON.stringify(context)}`
}

/**
 * Add context as Sentry breadcrumb
 */
function addBreadcrumb(level: LogLevel, message: string, context?: LogContext): void {
  if (!isProduction) return

  Sentry.addBreadcrumb({
    category: 'app',
    message,
    level: level === 'warn' ? 'warning' : level,
    data: context,
  })
}

/**
 * Logger interface
 */
interface Logger {
  /**
   * Debug level logging - only outputs in development
   * Use for detailed debugging information
   */
  debug: (message: string, context?: LogContext) => void

  /**
   * Info level logging - only outputs in development
   * Use for general informational messages
   */
  info: (message: string, context?: LogContext) => void

  /**
   * Warning level logging - outputs to console and Sentry breadcrumb
   * Use for potential issues that don't stop execution
   */
  warn: (message: string, context?: LogContext) => void

  /**
   * Error level logging - outputs to console and Sentry
   * Use for errors that need attention
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => void

  /**
   * Create a child logger with a fixed prefix/context
   * Useful for component-specific logging
   */
  child: (prefix: string, defaultContext?: LogContext) => Logger
}

/**
 * Create a logger instance
 */
function createLogger(prefix?: string, defaultContext?: LogContext): Logger {
  const formatWithPrefix = (msg: string) => (prefix ? `[${prefix}] ${msg}` : msg)

  return {
    debug(message: string, context?: LogContext) {
      // Only log in development
      if (isDevelopment) {
        console.debug(
          formatWithPrefix(message),
          context ? { ...defaultContext, ...context } : defaultContext
        )
      }
    },

    info(message: string, context?: LogContext) {
      // Only log in development
      if (isDevelopment) {
        console.info(
          formatWithPrefix(message),
          context ? { ...defaultContext, ...context } : defaultContext
        )
      }
    },

    warn(message: string, context?: LogContext) {
      const mergedContext = context ? { ...defaultContext, ...context } : defaultContext

      // Always log to console
      console.warn(formatWithPrefix(message), mergedContext)

      // Add as Sentry breadcrumb in production
      addBreadcrumb('warn', formatWithPrefix(message), mergedContext)
    },

    error(message: string, error?: Error | unknown, context?: LogContext) {
      const mergedContext = context ? { ...defaultContext, ...context } : defaultContext

      // Always log to console
      if (error) {
        console.error(formatWithPrefix(message), error, mergedContext)
      } else {
        console.error(formatWithPrefix(message), mergedContext)
      }

      // Report to Sentry in production
      if (isProduction) {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: {
              message: formatWithPrefix(message),
              ...mergedContext,
            },
          })
        } else if (error) {
          Sentry.captureMessage(formatWithPrefix(message), {
            level: 'error',
            extra: {
              error: String(error),
              ...mergedContext,
            },
          })
        } else {
          Sentry.captureMessage(formatWithPrefix(message), {
            level: 'error',
            extra: mergedContext,
          })
        }
      }
    },

    child(childPrefix: string, childContext?: LogContext) {
      const newPrefix = prefix ? `${prefix}:${childPrefix}` : childPrefix
      const newContext = childContext ? { ...defaultContext, ...childContext } : defaultContext
      return createLogger(newPrefix, newContext)
    },
  }
}

/**
 * Default logger instance
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger'
 *
 * logger.info('Something happened')
 * logger.error('Failed to upload', error, { fileId: '123' })
 * ```
 */
export const logger = createLogger()

/**
 * Create a component-specific logger
 *
 * Usage:
 * ```ts
 * import { createComponentLogger } from '@/lib/logger'
 *
 * const log = createComponentLogger('UploadWizard')
 * log.info('Step changed', { step: 2 })
 * log.error('File upload failed', error)
 * ```
 */
export function createComponentLogger(componentName: string, defaultContext?: LogContext): Logger {
  return createLogger(componentName, defaultContext)
}

/**
 * Create a module-specific logger
 *
 * Usage:
 * ```ts
 * import { createModuleLogger } from '@/lib/logger'
 *
 * const log = createModuleLogger('convex/souls')
 * log.debug('Query executed', { count: 10 })
 * ```
 */
export function createModuleLogger(moduleName: string, defaultContext?: LogContext): Logger {
  return createLogger(moduleName, defaultContext)
}

/**
 * Capture an exception directly to Sentry with context
 * Use when you need more control than logger.error provides
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id?: string; email?: string; username?: string }
  }
): void {
  if (isDevelopment) {
    console.error('[Sentry] Would capture exception:', error, context)
    return
  }

  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  })
}

/**
 * Set user context for Sentry
 * Call this when user logs in
 */
export function setUser(
  user: {
    id: string
    email?: string
    username?: string
  } | null
): void {
  if (isDevelopment) {
    console.debug('[Sentry] Set user:', user)
    return
  }

  Sentry.setUser(user)
}

/**
 * Add a tag to all future Sentry events
 */
export function setTag(key: string, value: string): void {
  if (isDevelopment) {
    console.debug('[Sentry] Set tag:', key, value)
    return
  }

  Sentry.setTag(key, value)
}

/**
 * Add extra context to all future Sentry events
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (isDevelopment) {
    console.debug('[Sentry] Set context:', name, context)
    return
  }

  Sentry.setContext(name, context)
}
