import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'About souls.directory - SOUL.md Community for OpenClaw',
  description:
    'Learn about souls.directory - the community directory of SOUL.md personality templates for OpenClaw. Discover why AI personality matters.',
  path: '/about',
  noSuffix: true,
  keywords: ['about', 'SOUL.md', 'OpenClaw', 'AI personality', 'what is souls.directory'],
})

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'About', url: '/about' }]} />
      <main className="min-h-screen">
        <PageContainer paddingY="hero">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ name: 'About' }]} className="mb-8" />

          {/* Hero */}
          <header className="text-center mb-16">
            <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">
              About souls.directory
            </h1>
            <p className="text-sm text-text-secondary max-w-xl mx-auto">
              The community directory of SOUL.md personality templates for{' '}
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:underline"
              >
                OpenClaw
              </a>
              .
            </p>
          </header>

          {/* Content */}
          <article className="space-y-16">
            {/* The Problem */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">The Problem</h2>
              <div className="bg-surface border border-border rounded-lg p-5 mb-4">
                <p className="text-text-secondary italic text-sm leading-relaxed">
                  &ldquo;I&apos;d be happy to help!&rdquo;
                  <br />
                  &ldquo;Great question!&rdquo;
                  <br />
                  &ldquo;Let me assist you with that!&rdquo;
                </p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Every AI assistant sounds the same. It&apos;s polite. It&apos;s functional.
                It&apos;s <em>boring</em>.
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Worse, it&apos;s impersonal. Your assistant should reflect who <em>you</em> are and
                how <em>you</em> work—not sound like every other chatbot on the internet.
              </p>
            </section>

            {/* The Solution */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">The Solution</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                <strong className="text-text">SOUL.md files</strong> are the format used by{' '}
                <a
                  href="https://openclaw.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text hover:underline"
                >
                  OpenClaw
                </a>{' '}
                to define an AI agent&apos;s personality. They specify:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 list-none pl-0">
                {[
                  { title: 'Core values', desc: 'What matters to this personality?' },
                  { title: 'Communication style', desc: 'How does it express itself?' },
                  { title: 'Boundaries', desc: "What won't it do?" },
                  { title: 'Vibe', desc: "What's it like to interact with?" },
                ].map((item) => (
                  <li key={item.title} className="bg-surface border border-border rounded-lg p-4">
                    <span className="text-sm text-text font-medium block mb-1">{item.title}</span>
                    <span className="text-xs text-text-secondary">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Why Personality Matters */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">Why Personality Matters</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-text mb-2">1. It&apos;s more engaging</h3>
                  <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
                    <div>
                      <span className="text-xs text-text-muted uppercase tracking-wider font-mono">
                        Generic AI
                      </span>
                      <p className="text-text-secondary text-sm mt-1">
                        &ldquo;I&apos;ll help you debug this code.&rdquo;
                      </p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <span className="text-xs text-text-muted uppercase tracking-wider font-mono">
                        Film Noir Detective
                      </span>
                      <p className="text-text text-sm mt-1">
                        &ldquo;It was 2 AM when the call came in. Another 500 error. I pulled up the
                        logs. Line 247. The stack trace doesn&apos;t lie, kid.&rdquo;
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-3">Same help. Infinitely more fun.</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text mb-2">
                    2. It&apos;s more effective
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-2">
                    Different tasks need different approaches. Code reviews need thorough and
                    constructive. Brainstorming needs creative and encouraging. Security needs
                    paranoid (in a good way).
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Personality isn&apos;t decoration—it&apos;s functional.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text mb-2">3. It&apos;s yours</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Your agent should feel like <em>your</em> agent. Not a generic tool everyone
                    else has. Personality makes it distinct.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">How It Works</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-lg p-5">
                  <h3 className="text-sm font-medium text-text mb-3">For Users</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
                    <li>Browse the directory by category</li>
                    <li>Preview personalities before using them</li>
                    <li>Copy the SOUL.md content</li>
                    <li>Paste into your OpenClaw agent&apos;s SOUL.md file</li>
                  </ol>
                  <p className="text-sm text-text mt-3 font-medium">
                    Done. Your agent now has personality.
                  </p>
                </div>

                <div className="bg-surface border border-border rounded-lg p-5">
                  <h3 className="text-sm font-medium text-text mb-3">For Contributors</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
                    <li>Create a unique personality</li>
                    <li>Submit via GitHub PR</li>
                    <li>Get reviewed (48h turnaround)</li>
                    <li>Go live — Your soul helps others!</li>
                  </ol>
                  <p className="text-sm text-text mt-3 font-medium">
                    All submissions are MIT licensed and credited to you.
                  </p>
                </div>
              </div>
            </section>

            {/* Our Principles */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">Our Principles</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Quality over Quantity',
                    desc: 'We curate. Distinctive, useful, well-crafted, and tested.',
                  },
                  {
                    title: 'Open & Free Forever',
                    desc: 'MIT licensed. No paywalls. No accounts required to browse.',
                  },
                  {
                    title: 'Credit Where Due',
                    desc: 'Every soul credits its author. Your work, your recognition.',
                  },
                  {
                    title: 'Community-First',
                    desc: "This isn't a company. It's a community project.",
                  },
                ].map((principle) => (
                  <div
                    key={principle.title}
                    className="bg-surface border border-border rounded-lg p-4"
                  >
                    <h3 className="text-sm font-medium text-text mb-1">{principle.title}</h3>
                    <p className="text-xs text-text-secondary">{principle.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-12 border-t border-border">
              <h2 className="text-lg font-medium text-text mb-3">Ready to find your soul?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={ROUTES.souls}
                  className="px-4 py-2 rounded-md border border-border text-sm text-text hover:border-text-secondary transition-colors"
                >
                  Browse Souls
                </Link>
                <Link
                  href={ROUTES.upload}
                  className="px-4 py-2 rounded-md text-sm text-text-secondary hover:text-text transition-colors"
                >
                  Submit Your Soul
                </Link>
              </div>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  )
}
