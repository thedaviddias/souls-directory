/**
 * Homepage Content - Client Component
 *
 * Receives pre-fetched data from the server component.
 * Handles animations and interactivity.
 */

'use client'

import { PageContainer } from '@/components/layout/page-container'
import { SectionHeader } from '@/components/marketing/section-header'
import { SearchInput } from '@/components/search/search-input'
import { CategoryBadge } from '@/components/shared/category-badge'
import { SoulCard } from '@/components/souls/soul-card'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'
import { Button } from '@/components/ui/button'
import { faqItems } from '@/lib/faq-data'
import { ROUTES, soulsByCategoryPath, soulsFeaturedPath, soulsSortPath } from '@/lib/routes'
import type { Category, Soul } from '@/types'
import Link from 'next/link'

interface HomeContentProps {
  categories: Category[]
  featured: Soul[]
  souls: Soul[]
  recentSouls: Soul[]
  totalSouls: number
}

export function HomeContent({
  categories,
  featured,
  souls,
  recentSouls,
  totalSouls,
}: HomeContentProps) {
  return (
    <main id="main-content" className="min-h-screen">
      <PageContainer paddingY="hero">
        {/* SECTION 1: HERO */}
        <header className="text-center mb-20">
          <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">
            Give your agent a soul.
          </h1>

          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
            A curated directory of SOUL.md personality templates for{' '}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:underline"
            >
              OpenClaw
            </a>{' '}
            agents. Browse, use, or publish your own—free and open source.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
            <Button asChild variant="primary">
              <Link href={ROUTES.upload}>Publish your soul</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.souls}>Browse Souls</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-text-muted font-mono mb-8">
            <span>{totalSouls.toLocaleString()} souls</span>
            <span className="w-px h-3 bg-border" aria-hidden="true" />
            <span>{categories.length} categories</span>
            <span className="w-px h-3 bg-border" aria-hidden="true" />
            <span>{featured.length} featured</span>
          </div>

          {/* Search bar */}
          <div className="flex justify-center">
            <SearchInput />
          </div>
        </header>

        {/* SECTION: HOW IT WORKS */}
        <section className="mb-20">
          <SectionHeader
            as="h2"
            title="How it works"
            description="Find, copy, and use personality templates in minutes"
            sticky={false}
          />
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            <li className="flex gap-4">
              <span
                className="shrink-0 w-8 h-8 rounded-md border border-border bg-surface flex items-center justify-center text-sm font-mono text-text-muted"
                aria-hidden
              >
                1
              </span>
              <div>
                <h3 className="text-sm font-medium text-text mb-1">Find a soul</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <Link href={ROUTES.souls} className="text-text hover:underline">
                    Browse the directory
                  </Link>{' '}
                  or search by category. Each soul has a description and a raw SOUL.md you can use.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span
                className="shrink-0 w-8 h-8 rounded-md border border-border bg-surface flex items-center justify-center text-sm font-mono text-text-muted"
                aria-hidden
              >
                2
              </span>
              <div>
                <h3 className="text-sm font-medium text-text mb-1">Copy or use the URL</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  On a soul&apos;s page, copy the content to clipboard or use the raw URL in your
                  agent. The URL is unique per soul.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span
                className="shrink-0 w-8 h-8 rounded-md border border-border bg-surface flex items-center justify-center text-sm font-mono text-text-muted"
                aria-hidden
              >
                3
              </span>
              <div>
                <h3 className="text-sm font-medium text-text mb-1">Use in your agent</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Paste into your OpenClaw agent&apos;s SOUL.md file or point your tooling at the
                  raw endpoint. You can also{' '}
                  <Link href={ROUTES.upload} className="text-text hover:underline">
                    publish your own
                  </Link>
                  .
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* SECTION 2: FEATURED */}
        {featured.length > 0 && (
          <section className="mb-20">
            <SectionHeader
              as="h2"
              title="Featured"
              description="Curated picks from the directory"
              viewAllHref={soulsFeaturedPath()}
              viewAllText="View all featured souls"
              sticky={false}
            />
            <SoulCardGrid className="mt-6">
              {featured.map((soul, index) => (
                <SoulCard key={soul.id} soul={soul} featured />
              ))}
            </SoulCardGrid>
          </section>
        )}

        {/* SECTION 3: RECENTLY PUBLISHED */}
        {souls.length > 0 && (
          <section id="recently-published" className="mb-20">
            <SectionHeader
              as="h2"
              title="Recently published"
              description="New souls added to the directory"
              viewAllHref={soulsSortPath('published')}
              viewAllText="View all recently published souls"
              sticky={false}
            />

            <SoulCardGrid className="mt-6">
              {souls.map((soul) => (
                <SoulCard key={soul.id} soul={soul} />
              ))}
            </SoulCardGrid>

            <div className="mt-8 text-center">
              <Button asChild variant="secondary">
                <Link href={ROUTES.souls}>View full directory →</Link>
              </Button>
            </div>
          </section>
        )}

        {/* SECTION: RECENT SOULS */}
        {recentSouls.length > 0 && (
          <section className="mb-20">
            <SectionHeader
              as="h2"
              title="Recently updated"
              description="New and recently updated souls"
              viewAllHref={soulsSortPath('recent')}
              viewAllText="View all recent souls"
              sticky={false}
            />
            <SoulCardGrid className="mt-6">
              {recentSouls.map((soul) => (
                <SoulCard key={soul.id} soul={soul} showUpdatedDate />
              ))}
            </SoulCardGrid>
          </section>
        )}

        {/* SECTION 4: BROWSE BY CATEGORY */}
        {categories.length > 0 && (
          <section className="mb-20">
            <SectionHeader
              as="h2"
              title="Categories"
              description="Explore souls by specialty"
              viewAllHref={ROUTES.souls}
              viewAllText="View all categories"
              sticky={false}
            />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={soulsByCategoryPath(category.slug)}
                  className="group flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3 transition-all duration-200 hover:border-text-muted"
                >
                  <CategoryBadge category={category} size="md" variant="minimal" />
                  <span className="text-xs text-text-muted font-mono">
                    {category.soulCount?.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: FAQ TEASER */}
        <section className="mb-20">
          <SectionHeader
            as="h2"
            title="Common questions"
            description="Quick answers; full FAQ for more"
            viewAllHref={ROUTES.faq}
            viewAllText="View all FAQ"
            sticky={false}
          />
          <ul className="mt-6 space-y-4">
            {faqItems.slice(0, 3).map((item) => (
              <li key={item.question}>
                <Link
                  href={ROUTES.faq}
                  className="group block rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-text-muted"
                >
                  <h3 className="text-sm font-medium text-text group-hover:text-text-secondary">
                    {item.question}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{item.answer}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
    </main>
  )
}
