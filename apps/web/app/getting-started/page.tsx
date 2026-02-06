/**
 * Getting Started - OpenClaw SOUL.md setup guide
 *
 * Targets search queries like "how to set up OpenClaw SOUL.md" and
 * "openclaw setup". Step-by-step onboarding for new OpenClaw users.
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { SITE_CONFIG } from '@/lib/seo'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'Getting Started - Install a SOUL.md for OpenClaw',
  description:
    'Step-by-step guide to set up OpenClaw with a SOUL.md personality from souls.directory. Install, browse, and customize your agent in minutes.',
  path: '/getting-started',
  noSuffix: true,
  keywords: [
    'openclaw setup',
    'openclaw SOUL.md',
    'how to install SOUL.md',
    'openclaw personality',
    'openclaw get started',
  ],
})

export default function GettingStartedPage() {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, '')

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Getting Started', url: '/getting-started' }]} />
      <main className="min-h-screen">
        <PageContainer paddingY="hero">
          <Breadcrumb items={[{ name: 'Getting Started' }]} className="mb-8" />

          <header className="mb-12">
            <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">
              Get your first soul running with OpenClaw
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              A short guide to install OpenClaw, pick a personality from souls.directory, and drop
              it into your workspace.
            </p>
          </header>

          <ol className="space-y-12 list-none">
            {/* Step 1 */}
            <li>
              <section className="border border-border rounded-lg p-6 bg-surface">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                  Step 1
                </span>
                <h2 className="text-lg font-medium text-text mt-2 mb-3">Install OpenClaw</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  OpenClaw is the local-first AI agent that uses SOUL.md files to define
                  personality. Install it on your machine and complete the initial setup (e.g.
                  connect a messaging channel, set your workspace path).
                </p>
                <Button asChild variant="secondary" size="sm">
                  <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">
                    OpenClaw website and docs
                  </a>
                </Button>
              </section>
            </li>

            {/* Step 2 */}
            <li>
              <section className="border border-border rounded-lg p-6 bg-surface">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                  Step 2
                </span>
                <h2 className="text-lg font-medium text-text mt-2 mb-3">Browse souls.directory</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Pick a SOUL.md template that fits how you want your agent to behave—professional,
                  creative, technical, playful, and more. Each soul has a short description and
                  category.
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href={ROUTES.souls}>Browse souls</Link>
                </Button>
              </section>
            </li>

            {/* Step 3 */}
            <li>
              <section className="border border-border rounded-lg p-6 bg-surface">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                  Step 3
                </span>
                <h2 className="text-lg font-medium text-text mt-2 mb-3">One-command install</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  From any soul page, copy the install command (or use the one below with a slug you
                  chose). This downloads the SOUL.md file into your OpenClaw workspace.
                </p>
                <pre className="text-xs font-mono text-text bg-elevated border border-border rounded p-4 overflow-x-auto">
                  <code>
                    curl {baseUrl}/api/souls/&#123;slug&#125;.md &gt; ~/.openclaw/workspace/SOUL.md
                  </code>
                </pre>
                <p className="text-sm text-text-muted mt-3">
                  Replace <code className="font-mono text-text-secondary">{'{slug}'}</code> with the
                  soul&apos;s slug (e.g. <code className="font-mono">professional-developer</code>
                  ). You can find the exact command on each soul&apos;s page.
                </p>
              </section>
            </li>

            {/* Step 4 */}
            <li>
              <section className="border border-border rounded-lg p-6 bg-surface">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                  Step 4
                </span>
                <h2 className="text-lg font-medium text-text mt-2 mb-3">Customize (optional)</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  Edit the SOUL.md file in your workspace to tweak tone, instructions, or
                  constraints. You can also publish your own soul or remix an existing one from the
                  directory.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={ROUTES.upload}>Submit your own soul</Link>
                  </Button>
                  <Button asChild variant="primary" size="sm">
                    <Link href={ROUTES.souls}>Browse souls</Link>
                  </Button>
                </div>
              </section>
            </li>
          </ol>

          <p className="text-sm text-text-muted mt-12 text-center">
            Questions? See the{' '}
            <Link href={ROUTES.faq} className="text-text hover:underline">
              FAQ
            </Link>{' '}
            or{' '}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:underline"
            >
              OpenClaw docs
            </a>
            .
          </p>
        </PageContainer>
      </main>
    </>
  )
}
