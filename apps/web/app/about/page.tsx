import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'About souls.directory',
  description:
    'An independent community directory of SOUL.md personality templates for OpenClaw. Browse, share, and use souls to give your agent a distinct voice.',
  path: '/about',
  noSuffix: true,
  keywords: ['about', 'SOUL.md', 'OpenClaw', 'AI personality', 'souls.directory'],
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
              A community directory of SOUL.md personality templates for{' '}
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:underline"
              >
                OpenClaw
              </a>
              .
              <br />
              Built by{' '}
              <a
                href="https://thedaviddias.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:underline"
              >
                David Dias
              </a>
              . We&apos;re not affiliated with OpenClaw—just a place to find and share souls.
            </p>
          </header>

          {/* Content */}
          <article className="space-y-16">
            {/* What's a SOUL.md? */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">What&apos;s a SOUL.md?</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                <strong className="text-text">SOUL.md</strong> is the format OpenClaw uses to define
                an agent&apos;s personality. A soul file specifies:
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

            {/* How to use a soul */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">How to use a soul</h2>
              <div className="bg-surface border border-border rounded-lg p-5">
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
                  <li>Browse the directory by category</li>
                  <li>Preview personalities before using them</li>
                  <li>Copy the SOUL.md content</li>
                  <li>Paste into your OpenClaw agent&apos;s SOUL.md file</li>
                </ol>
                <p className="text-sm text-text mt-3 font-medium">
                  That&apos;s it. Your agent gets the personality you picked.
                </p>
              </div>
            </section>

            {/* How to contribute */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">How to contribute</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Souls are submitted through the site, not via GitHub PRs. You sign in with GitHub,
                use the upload wizard, and publish. No review queue—your soul goes live when you hit
                Publish.
              </p>
              <div className="bg-surface border border-border rounded-lg p-5">
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
                  <li>Sign in with GitHub</li>
                  <li>Go to the Upload page</li>
                  <li>Upload a file, import from a GitHub URL, or paste your markdown</li>
                  <li>Fill in metadata (name, description, category, tags) and publish</li>
                </ol>
                <p className="text-sm text-text mt-3 font-medium">
                  Submissions are MIT licensed and credited to you.
                </p>
              </div>
            </section>

            {/* The project */}
            <section>
              <h2 className="text-lg font-medium text-text mb-4">The project</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                souls.directory is open source and free to use. All souls are MIT licensed. You
                don&apos;t need an account to browse. The site and backend are on{' '}
                <a
                  href="https://github.com/thedaviddias/souls-directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text hover:underline"
                >
                  GitHub
                </a>
                ; code contributions (bugs, features, docs) go through pull requests there. Soul
                submissions stay on the website via the upload flow.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center py-12 border-t border-border">
              <h2 className="text-lg font-medium text-text mb-3">Browse or submit</h2>
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
