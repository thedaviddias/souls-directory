import { withSentryConfig } from '@sentry/nextjs'
import createWithVercelToolbar from '@vercel/toolbar/plugins/next'
import type { NextConfig } from 'next'

const withVercelToolbar = createWithVercelToolbar({
  enableInProduction: true,
})

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  // Next.js requires unsafe-inline and unsafe-eval for hydration scripts
  [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Plausible analytics
    'https://plausible.io',
    // Vercel analytics / speed insights / toolbar / flags
    'https://*.vercel-scripts.com https://vercel.live https://vercel.com',
  ].join(' '),
  // Styles — unsafe-inline required for UI libraries (Radix, etc.)
  "style-src 'self' 'unsafe-inline' https://vercel.live https://vercel.com",
  // Allow images from self, data URIs, GitHub avatars, Convex storage, Vercel toolbar/flags
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.convex.cloud https://vercel.live https://vercel.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com",
  // Fonts — self + Vercel toolbar
  "font-src 'self' https://vercel.live https://assets.vercel.com",
  // Allow connections to Convex, GitHub API, Plausible, Sentry, Vercel toolbar/flags
  [
    "connect-src 'self'",
    // Convex (HTTP + WebSocket)
    'https://*.convex.cloud wss://*.convex.cloud',
    // GitHub API (soul imports)
    'https://api.github.com https://raw.githubusercontent.com',
    // Plausible analytics
    'https://plausible.io',
    // Sentry error tracking
    'https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.sentry.io',
    // Vercel (insights, toolbar, flags API, blob storage)
    'https://*.vercel-insights.com https://vercel.live https://vercel.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com',
    // Vercel toolbar WebSocket
    'wss://ws-us3.pusher.com',
    // Vercel toolbar local dev server (branch sync, events; port can vary per run)
    'http://localhost:25030 http://localhost:25031 http://localhost:25032 http://localhost:25033 http://localhost:25034 http://localhost:25035 http://localhost:43214 ws://localhost:25030 ws://localhost:25031 ws://localhost:25032 ws://localhost:25033 ws://localhost:25034 ws://localhost:25035 ws://localhost:43214',
  ].join(' '),
  // Frames — Vercel toolbar (and Flags Explorer)
  "frame-src 'self' https://vercel.live https://vercel.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Prevent plugin loading
  "object-src 'none'",
  // Workers from same origin only
  "worker-src 'self' blob:",
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
        ],
      },
    ]
  },
}

/**
 * Sentry configuration for the build process
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
const sentryConfig = {
  // Organization and project are needed for source maps
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // ============================================
  // SOURCE MAPS - Disabled for free tier
  // ============================================
  // Source maps upload requires SENTRY_AUTH_TOKEN and uses bandwidth
  // Enable when you have a paid plan or want better stack traces

  // Only enable source map upload when auth token is present
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source map upload warnings when auth token is missing
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from users (recommended for production)
  hideSourceMaps: true,

  // Disable source map upload if no auth token (free tier optimization)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // ============================================
  // BUILD OPTIMIZATION
  // ============================================

  // Tree-shake Sentry debug logging to reduce bundle size
  // Note: Not supported with Turbopack (dev server uses Turbopack)
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },

  // Tunnel: proxy Sentry events through our origin to bypass ad-blockers
  tunnelRoute: '/monitoring-tunnel',

  // Automatically instrument React components for performance monitoring
  // This can add overhead, so it's disabled by default
  // reactComponentAnnotation: { enabled: true },
}

const configWithSentry = withSentryConfig(nextConfig, sentryConfig)
export default withVercelToolbar(configWithSentry)
