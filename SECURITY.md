# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you believe you have found a security issue in souls.directory, please report it privately:

1. **Preferred:** Use [GitHub's private vulnerability reporting](https://github.com/thedaviddias/souls-directory/security/advisories/new) for this repository.
2. **Alternative:** Contact the maintainer ([@thedaviddias](https://github.com/thedaviddias)) privately with enough detail to reproduce the issue.

We will acknowledge your report within **48 hours** and will keep you updated on the status of any fix.

## Supported Versions

Only the **latest version deployed to production** is supported with security updates. This is a hosted web application; we do not maintain multiple release lines.

## Security Measures in Place

We maintain the following security practices:

- **Authentication:** Convex Auth with GitHub OAuth. Role-based access control (admin, moderator, user) and ownership checks on all mutations.
- **Rate limiting:** Upstash Redis–backed rate limiting on public API routes (e.g. soul fetch, search), with HTTP 429 and standard rate-limit headers when exceeded.
- **Security headers:** Content-Security-Policy, Strict-Transport-Security, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and Permissions-Policy.
- **Error monitoring:** Sentry with PII filtering and sampling; no sensitive data in error reports.
- **Authorization:** Resource-level ownership checks and role-gated operations (e.g. tag creation restricted to admin/moderator).

## Scope

**In scope** for security reports:

- The souls.directory web application (production deployment).
- Convex backend functions and data access.
- Authentication and authorization flows.
- API endpoints under `/api/`.

**Out of scope:**

- Third-party infrastructure (GitHub, Convex, Vercel, Upstash).
- Social engineering or physical security.
- Denial-of-service attacks (we rely on rate limiting and provider mitigations).
- Vulnerabilities in dependencies that are already publicly disclosed (please report those to the upstream project).

## Disclosure Policy

We follow coordinated disclosure: we ask that you give us reasonable time to address the issue before any public disclosure. With your permission, we will credit you in release notes or a security advisory when the fix is published.
