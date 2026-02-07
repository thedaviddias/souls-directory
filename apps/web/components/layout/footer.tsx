/**
 * Footer - Minimalist site footer
 *
 * Design: Typography-first, grayscale palette inspired by cursor.directory
 * - Monospace logo text
 * - Simple text links
 * - Subtle borders
 */

'use client'

import { useCollectionsEnabled } from '@/components/flags-provider'
import { PageContainer } from '@/components/layout/page-container'
import { EXTERNAL_LINKS, ROUTES, soulsByCategoryPath } from '@/lib/routes'
import { ExternalLink } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'

type FooterLink =
  | { href: Route; label: string; external?: false }
  | { href: string; label: string; external: true }

const directoryLinks: FooterLink[] = [
  { href: ROUTES.souls, label: 'Browse All' },
  { href: ROUTES.collections, label: 'Collections' },
  { href: soulsByCategoryPath('professional'), label: 'Professional' },
  { href: soulsByCategoryPath('creative'), label: 'Creative' },
  { href: soulsByCategoryPath('technical'), label: 'Technical' },
  { href: soulsByCategoryPath('playful'), label: 'Playful' },
]

const learnLinks: FooterLink[] = [
  { href: ROUTES.gettingStarted, label: 'Getting Started' },
  { href: ROUTES.quiz, label: 'Find Your Soul' },
  { href: ROUTES.guides, label: 'Guides' },
  { href: '/llms.txt' as Route, label: 'llms.txt' },
]

const siteLinks: FooterLink[] = [
  { href: ROUTES.about, label: 'About' },
  { href: ROUTES.faq, label: 'FAQ' },
  { href: ROUTES.upload, label: 'Submit Soul' },
  { href: 'https://openclaw.ai', label: 'OpenClaw', external: true },
]

const communityLinks: FooterLink[] = [
  { href: EXTERNAL_LINKS.github, label: 'GitHub', external: true },
  { href: EXTERNAL_LINKS.x, label: 'X', external: true },
  { href: EXTERNAL_LINKS.linkedin, label: 'LinkedIn', external: true },
]

/** Other open-source projects by the same author (name + URL). */
const otherProjectsLinks: { name: string; href: string }[] = [
  { name: 'frontendchecklist.io', href: 'https://frontendchecklist.io' },
  { name: 'uxpatterns.dev', href: 'https://uxpatterns.dev' },
  { name: 'llmstxthub.com', href: 'https://llmstxthub.com' },
  { name: 'daviddias.digital', href: 'https://daviddias.digital' },
  { name: 'goshuin.com', href: 'https://goshuin.com' },
  { name: 'goshuinatlas.com', href: 'https://goshuinatlas.com' },
]

export function Footer() {
  const collectionsEnabled = useCollectionsEnabled()
  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Directory',
      links: directoryLinks.filter(
        (link) => link.href !== ROUTES.collections || collectionsEnabled
      ),
    },
    { title: 'Learn', links: learnLinks },
    { title: 'Site', links: siteLinks },
    { title: 'Community', links: communityLinks },
  ]
  return (
    <footer className="border-t border-border bg-surface">
      <PageContainer>
        <h2 className="sr-only">Site footer</h2>
        {/* Brand + short tagline above the columns */}
        <div className="pt-10 pb-8">
          <Link href={ROUTES.home} className="inline-block mb-3 font-mono text-sm text-text">
            souls.directory
          </Link>
          <p className="text-sm text-text-secondary max-w-md">
            Curated SOUL.md personality templates for{' '}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:underline"
            >
              OpenClaw
            </a>{' '}
            agents.
            <br />
            Find the soul that speaks to you.
          </p>
        </div>

        {/* Four link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium text-text mb-4 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-secondary hover:text-text transition-colors inline-flex items-center gap-1"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-secondary hover:text-text transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Other open-source projects */}
        <nav className="border-t border-border py-6" aria-label="Other open-source projects">
          <ul className="flex flex-wrap items-center justify-end gap-x-1 gap-y-1 text-xs text-text-secondary">
            {otherProjectsLinks.map((project, index) => (
              <li key={project.href} className="inline-flex items-center gap-x-1">
                {index > 0 && (
                  <span className="text-text-muted" aria-hidden="true">
                    ·
                  </span>
                )}
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text transition-colors"
                >
                  {project.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            Built by{' '}
            <a
              href="https://thedaviddias.com"
              className="text-text hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              David Dias
            </a>
          </p>

          <p className="text-xs text-text-muted">
            Open source •{' '}
            <a
              href="https://github.com/thedaviddias/souls-directory/blob/main/LICENSE"
              className="hover:text-text-secondary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
          </p>
        </div>
      </PageContainer>
    </footer>
  )
}
