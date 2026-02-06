/**
 * SEO guide: How to write a great SOUL.md
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'How to Write a Great SOUL.md for OpenClaw',
  description:
    'Tips for writing an effective SOUL.md: voice, structure, boundaries, and model compatibility. Improve your OpenClaw agent’s personality.',
  path: '/guides/openclaw-personality-tips',
  keywords: [
    'write SOUL.md',
    'OpenClaw personality',
    'SOUL.md tips',
    'how to write SOUL.md',
    'OpenClaw custom soul',
  ],
})

export default function OpenClawPersonalityTipsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Guides', url: '/guides' },
          { name: 'How to Write a Great SOUL.md', url: '/guides/openclaw-personality-tips' },
        ]}
      />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb
            items={[
              { name: 'Guides', href: ROUTES.guides },
              { name: 'How to write a great SOUL.md' },
            ]}
            className="mb-6"
          />
          <article className="max-w-prose">
            <h1 className="text-2xl font-medium text-text mb-4">How to Write a Great SOUL.md</h1>
            <p className="text-sm text-text-secondary mb-8">
              A good SOUL.md is clear, consistent, and actionable. These tips help you define voice,
              structure, and boundaries so your OpenClaw agent feels intentional and reliable.
            </p>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Define the voice first</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Start with 2–3 sentences that describe how the agent should sound: formal or casual,
                terse or verbose, cautious or bold. Examples: “You are a senior engineer. You are
                direct and avoid filler. You suggest; you don’t run.” or “You are a supportive
                writing coach. You ask questions before giving advice.”
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Keep this at the top of SOUL.md so the model sees it first. Consistency here matters
                more than length.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Add clear boundaries</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Spell out what the agent must never do (e.g. run destructive commands without
                confirmation, share secrets, or assume permissions). List what it should always do
                (e.g. cite sources, suggest tests, or ask for context). Short bullet lists are
                easier to follow than long paragraphs.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Structure for scanning</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Use headers (e.g. ## Role, ## Tone, ## Constraints) so both humans and models can
                scan the file. Put the most important rules near the top. If you reference external
                docs or tools, link them explicitly.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-medium text-text mb-3">Test with your model</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                SOUL.md behavior can vary by model. Note which models you’ve tested (e.g. Claude
                Sonnet 4.5, GPT-4o) and mention them in your soul’s metadata when you publish. On
                souls.directory you can filter by “Tested with” to find souls that match your stack.
              </p>
            </section>

            <section>
              <p className="text-sm text-text-secondary">
                Once you’re happy with your SOUL.md, you can{' '}
                <Link href={ROUTES.upload} className="text-text hover:underline">
                  submit it
                </Link>{' '}
                to souls.directory so others can use and remix it. Start from an existing soul and
                use “Fork” to adapt it to your needs.
              </p>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  )
}
