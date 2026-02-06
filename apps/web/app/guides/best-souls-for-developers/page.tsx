/**
 * SEO guide: Best SOUL.md templates for developers
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES, soulsByCategoryPath } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: '10 Best SOUL.md Templates for Developers',
  description:
    'Curated SOUL.md templates for developers: code review, debugging, DevOps, and technical writing. Find the right OpenClaw soul for your workflow.',
  path: '/guides/best-souls-for-developers',
  keywords: [
    'best SOUL.md developers',
    'OpenClaw developer soul',
    'SOUL.md coding',
    'developer AI personality',
    'OpenClaw templates developers',
  ],
})

export default function BestSoulsForDevelopersPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Guides', url: '/guides' },
          { name: 'Best SOUL.md for Developers', url: '/guides/best-souls-for-developers' },
        ]}
      />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb
            items={[{ name: 'Guides', href: ROUTES.guides }, { name: 'Best souls for developers' }]}
            className="mb-6"
          />
          <article className="max-w-prose">
            <h1 className="text-2xl font-medium text-text mb-4">
              10 Best SOUL.md Templates for Developers
            </h1>
            <p className="text-sm text-text-secondary mb-8">
              Developers need agents that understand code, respect constraints, and match their
              workflow. Here’s how to find and use the best SOUL.md templates for coding, review,
              and ops.
            </p>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">What makes a “developer” soul?</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                A strong developer SOUL.md is clear about scope (e.g. “focus on correctness and
                security”), uses a direct tone, and often defines rules like “suggest, don’t run” or
                “prefer minimal, readable changes.” Many list compatible models (Claude, GPT-4o,
                etc.) so you can match your stack.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Where to find them</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                souls.directory organizes souls by category and model. For developer-focused
                templates:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary mb-4">
                <li>
                  <Link
                    href={soulsByCategoryPath('technical')}
                    className="text-text hover:underline"
                  >
                    Technical souls
                  </Link>{' '}
                  — coding, DevOps, security, tooling
                </li>
                <li>
                  <Link href={ROUTES.souls} className="text-text hover:underline">
                    Browse all souls
                  </Link>{' '}
                  and filter by “Tested with” (e.g. Claude Sonnet 4.5, GPT-4o) to match your model
                </li>
                <li>
                  <Link href={ROUTES.collections} className="text-text hover:underline">
                    Collections
                  </Link>{' '}
                  — e.g. “Developer Companion” starter pack
                </li>
              </ul>
              <p className="text-sm text-text-secondary leading-relaxed">
                Use the one-command install on each soul’s page to drop SOUL.md into your OpenClaw
                workspace. You can fork and remix any soul to tailor it to your team.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Quick picks by use case</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                <li>
                  <strong className="text-text">Code review</strong> — look for souls that emphasize
                  clarity, security, and minimal diff.
                </li>
                <li>
                  <strong className="text-text">Debugging</strong> — souls that ask clarifying
                  questions and suggest hypotheses.
                </li>
                <li>
                  <strong className="text-text">DevOps / ops</strong> — brief, factual, and cautious
                  about destructive actions.
                </li>
                <li>
                  <strong className="text-text">Documentation</strong> — technical writing tone and
                  structure.
                </li>
              </ul>
            </section>

            <section>
              <p className="text-sm text-text-secondary">
                <Link href={soulsByCategoryPath('technical')} className="text-text hover:underline">
                  View technical souls on souls.directory
                </Link>{' '}
                or run the{' '}
                <Link href={ROUTES.quiz} className="text-text hover:underline">
                  Find Your Soul
                </Link>{' '}
                quiz to get personalized recommendations.
              </p>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  )
}
