import type { GuideHeading } from '@/lib/guides'
import { TableOfContents } from './table-of-contents'

interface GuideLayoutProps {
  children: React.ReactNode
  headings: GuideHeading[]
}

/**
 * Two-column layout for guide articles: main content + sticky TOC sidebar.
 * On mobile, TOC is a collapsible section above the article.
 */
export function GuideLayout({ children, headings }: GuideLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:gap-10 lg:items-start">
        <article className="min-w-0 flex-1 max-w-[70ch] prose-minimal">{children}</article>
        <TableOfContents headings={headings} className="lg:mt-0" />
      </div>
    </div>
  )
}
