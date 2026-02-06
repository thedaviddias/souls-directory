/**
 * SEO guide: The Complete Guide to SOUL.md for OpenClaw
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'The Complete Guide to SOUL.md for OpenClaw',
  description:
    'Learn what SOUL.md is, how it shapes your OpenClaw agent’s personality, and how to choose or write one. Step-by-step guide for beginners.',
  path: '/guides/openclaw-soul-md-guide',
  keywords: [
    'SOUL.md',
    'OpenClaw',
    'OpenClaw SOUL.md',
    'agent personality',
    'AI personality template',
    'OpenClaw guide',
  ],
})

export default function OpenClawSoulMdGuidePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Guides', url: '/guides' },
          {
            name: 'The Complete Guide to SOUL.md for OpenClaw',
            url: '/guides/openclaw-soul-md-guide',
          },
        ]}
      />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb
            items={[{ name: 'Guides', href: ROUTES.guides }, { name: 'SOUL.md for OpenClaw' }]}
            className="mb-6"
          />
          <article className="max-w-prose">
            <h1 className="text-2xl font-medium text-text mb-4">
              The Complete Guide to SOUL.md for OpenClaw
            </h1>
            <p className="text-sm text-text-secondary mb-8">
              SOUL.md is the file that defines your OpenClaw agent’s personality, tone, and
              behavior. This guide covers what it is, how to use it, and where to find or write one.
            </p>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">What is SOUL.md?</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                SOUL.md is a markdown file that sits in your OpenClaw workspace and tells the agent
                how to present itself: its voice, priorities, and style. Unlike system prompts that
                only one model sees, SOUL.md is the persistent “soul” of your agent—what makes it
                feel like yours.
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                OpenClaw reads this file when starting or responding, so changing SOUL.md changes
                how your agent talks, what it emphasizes, and how it helps you.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Why use a SOUL.md?</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Default agents tend to sound generic. A SOUL.md gives you a consistent personality:
                more direct, more technical, more casual, or more formal. It can define roles (e.g.
                “senior dev reviewer”) and boundaries (e.g. “never run destructive commands without
                asking”).
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Using a curated SOUL.md from a directory like souls.directory is the fastest way to
                get a production-ready personality without writing one from scratch.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">How to install a SOUL.md</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
                <li>
                  Install OpenClaw and set up your workspace (see the official OpenClaw docs).
                </li>
                <li>
                  Browse{' '}
                  <Link href={ROUTES.souls} className="text-text hover:underline">
                    souls.directory
                  </Link>{' '}
                  and pick a soul that fits your use case.
                </li>
                <li>
                  Copy the one-command install (e.g.{' '}
                  <code className="bg-surface border border-border px-1 rounded text-text-muted font-mono text-xs">
                    curl https://souls.directory/api/souls/your-soul-slug.md &gt;
                    ~/.openclaw/workspace/SOUL.md
                  </code>
                  ) and run it in your terminal.
                </li>
                <li>Restart or reconfigure OpenClaw so it picks up the new SOUL.md.</li>
              </ol>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Next steps</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Try the{' '}
                <Link href={ROUTES.gettingStarted} className="text-text hover:underline">
                  Getting Started
                </Link>{' '}
                page for a full setup walkthrough, or{' '}
                <Link href={ROUTES.quiz} className="text-text hover:underline">
                  Find Your Soul
                </Link>{' '}
                to get personalized recommendations.
              </p>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  )
}
