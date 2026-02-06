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

const resourcesLinks: FooterLink[] = [
  { href: ROUTES.gettingStarted, label: 'Getting Started' },
  { href: ROUTES.quiz, label: 'Find Your Soul' },
  { href: ROUTES.guides, label: 'Guides' },
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

export function Footer() {
  const collectionsEnabled = useCollectionsEnabled()
  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: 'Directory',
      links: directoryLinks.filter(
        (link) => link.href !== ROUTES.collections || collectionsEnabled
      ),
    },
    { title: 'Resources', links: resourcesLinks },
    { title: 'Community', links: communityLinks },
  ]
  return (
    <footer className="border-t border-border bg-surface">
      <PageContainer>
        <h2 className="sr-only">Site footer</h2>
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={ROUTES.home} className="inline-block mb-4 font-mono text-sm text-text">
              souls.directory
            </Link>
            <p className="text-sm text-text-secondary mb-4">
              Curated SOUL.md personality templates for{' '}
              <a
                href="https://openclaw.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text hover:underline"
              >
                OpenClaw
              </a>{' '}
              agents. Find the soul that speaks to you.
            </p>
          </div>

          {/* Links sections */}
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
