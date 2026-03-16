import { z } from 'zod'

/** Deep link URL schema — validates souls-studio:// protocol URLs */
export const deepLinkUrlSchema = z.string().refine(
  (val) => {
    try {
      const url = new URL(val)
      return url.protocol === 'souls-studio:'
    } catch {
      return false
    }
  },
  { message: 'Invalid deep link URL: must use souls-studio:// protocol' }
)

/** Auth callback params from deep link */
export const authCallbackSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(2048)
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Auth code contains invalid characters'),
})

/** Gateway connection string */
export const gatewayUrlSchema = z
  .string()
  .url()
  .refine(
    (val) => {
      try {
        const url = new URL(val)
        return ['ws:', 'wss:'].includes(url.protocol)
      } catch {
        return false
      }
    },
    { message: 'Gateway URL must use ws:// or wss:// protocol' }
  )

/** SSH connection params */
export const sshConnectionSchema = z.object({
  host: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._\-]+$/, 'SSH host contains invalid characters'),
  user: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._\-]+$/, 'SSH user contains invalid characters'),
  port: z.number().int().min(1).max(65535),
  keyPath: z
    .string()
    .regex(/^[^;|&`$]+$/, 'Key path contains unsafe characters')
    .optional(),
})

/** Repository URL for adding custom repos */
export const repoUrlSchema = z
  .string()
  .regex(
    /github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)/,
    'Must be a valid GitHub repository URL'
  )

/** Soul metadata for creating/editing */
export const soulMetadataSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9._-]+$/, 'Slug must be lowercase alphanumeric with hyphens/dots'),
  tagline: z.string().max(500).default(''),
  description: z.string().max(5000).default(''),
  content: z.string().max(100_000).default(''),
})

/** Settings schema */
export const settingsSchema = z.object({
  installMethod: z.enum(['copy', 'npx']).default('copy'),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  editorFontSize: z.number().int().min(10).max(24).default(14),
  syncIntervalMs: z.number().int().min(5000).max(300_000).default(30_000),
})
