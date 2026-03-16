import Link from 'next/link'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description: 'Privacy Policy for souls.directory — how we handle your data.',
  path: '/privacy',
  noSuffix: true,
})

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Privacy Policy', url: '/privacy' }]} />
      <main className="min-h-screen">
        <PageContainer paddingY="hero">
          <Breadcrumb items={[{ name: 'Privacy Policy' }]} className="mb-8" />

          <header className="text-center mb-16">
            <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">Privacy Policy</h1>
            <p className="text-sm text-text-secondary">Last updated: March 16, 2026</p>
          </header>

          <article className="max-w-2xl mx-auto space-y-10 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-text mb-3">What we collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-text mb-1">Without an account</h3>
                  <p>
                    Privacy-friendly analytics (page views, referrers, browser/OS) via OpenPanel. No
                    personal data is collected. No cookies are used for tracking.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text mb-1">With a GitHub account</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>GitHub username, email, and avatar (from GitHub OAuth)</li>
                    <li>Souls you create, star, or comment on</li>
                    <li>Profile information you choose to add (bio, website, social handles)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">How we use it</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To provide the service (display your souls, profile, and activity)</li>
                <li>To understand how the site is used and improve it</li>
                <li>To prevent abuse and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">What we don&apos;t do</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>We don&apos;t sell or share your data with third parties</li>
                <li>We don&apos;t use your data for advertising</li>
                <li>We don&apos;t track you across other websites</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">Where data is stored</h2>
              <p>
                Data is stored in Convex (database) and Vercel (hosting). Both are US-based
                services. Analytics are processed by OpenPanel.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">Data retention</h2>
              <p>
                Your data is kept as long as your account is active. You can delete your account and
                associated data by contacting us on GitHub.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">Third-party services</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-text">GitHub</strong> &mdash; authentication (OAuth)
                </li>
                <li>
                  <strong className="text-text">Convex</strong> &mdash; database and backend
                </li>
                <li>
                  <strong className="text-text">Vercel</strong> &mdash; hosting and deployment
                </li>
                <li>
                  <strong className="text-text">OpenPanel</strong> &mdash; privacy-friendly
                  analytics
                </li>
                <li>
                  <strong className="text-text">Sentry</strong> &mdash; error monitoring
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">Changes</h2>
              <p>
                We may update this policy. Significant changes will be noted with an updated date.
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <p>
                Questions? Reach out on{' '}
                <a
                  href="https://github.com/thedaviddias/souls-directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text hover:underline"
                >
                  GitHub
                </a>
                . See also our{' '}
                <Link href={ROUTES.terms} className="text-text hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  )
}
