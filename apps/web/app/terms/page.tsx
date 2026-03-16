import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { ROUTES } from '@/lib/routes'
import { createMetadata } from '@/lib/seo'
import Link from 'next/link'

export const metadata = createMetadata({
  title: 'Terms of Service',
  description: 'Terms of Service for souls.directory — rules for using the platform.',
  path: '/terms',
  noSuffix: true,
})

export default function TermsPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Terms of Service', url: '/terms' }]} />
      <main className="min-h-screen">
        <PageContainer paddingY="hero">
          <Breadcrumb items={[{ name: 'Terms of Service' }]} className="mb-8" />

          <header className="text-center mb-16">
            <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">Terms of Service</h1>
            <p className="text-sm text-text-secondary">Last updated: March 16, 2026</p>
          </header>

          <article className="max-w-2xl mx-auto space-y-10 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-medium text-text mb-3">1. Acceptance</h2>
              <p>
                By using souls.directory you agree to these terms. If you don&apos;t agree, please
                don&apos;t use the site.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">2. What the service is</h2>
              <p>
                souls.directory is a community directory for browsing, uploading, and sharing
                SOUL.md personality templates. We are not affiliated with OpenClaw.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">3. Accounts</h2>
              <p>
                You sign in with GitHub OAuth. You&apos;re responsible for your account activity. We
                may suspend or remove accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">4. Content you submit</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Souls you publish are licensed under{' '}
                  <strong className="text-text">MIT License</strong> and credited to you.
                </li>
                <li>You must have the right to share any content you upload.</li>
                <li>
                  Don&apos;t submit content that is illegal, harmful, harassing, or infringes on
                  others&apos; rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">5. Moderation</h2>
              <p>
                We reserve the right to remove content or accounts that violate these terms, at our
                discretion and without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">6. No warranty</h2>
              <p>
                The service is provided &quot;as is&quot; without warranties of any kind. We
                don&apos;t guarantee uptime, accuracy, or fitness for any purpose.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">7. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, souls.directory and its maintainers are not
                liable for any damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-text mb-3">8. Changes</h2>
              <p>
                We may update these terms. Continued use after changes means you accept the new
                terms.
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
                <Link href={ROUTES.privacy} className="text-text hover:underline">
                  Privacy Policy
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
