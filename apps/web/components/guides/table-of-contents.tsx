'use client'

import type { GuideHeading } from '@/lib/guides'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface TableOfContentsProps {
  headings: GuideHeading[]
  className?: string
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0% -80% 0%', threshold: 0 }
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside className={cn('guide-toc', className)} aria-label="On this page">
      {/* Mobile: collapsible */}
      <div className="lg:hidden mb-6 border border-border rounded-lg bg-surface">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-text flex items-center justify-between"
          aria-expanded={mobileOpen}
        >
          On this page
          <span className="text-text-muted">{mobileOpen ? '−' : '+'}</span>
        </button>
        {mobileOpen && (
          <nav className="px-4 pb-3 border-t border-border pt-2">
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id} className={cn('text-sm', h.level === 3 && 'pl-3')}>
                  <a
                    href={`#${h.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block py-0.5 text-text-secondary hover:text-text transition-colors',
                      activeId === h.id && 'text-text'
                    )}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <nav className="hidden lg:block sticky top-24 w-[220px] shrink-0">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
          On this page
        </p>
        <ul className="space-y-1 border-l border-border pl-3">
          {headings.map((h) => (
            <li
              key={h.id}
              className={cn(
                'text-sm border-l-2 -ml-[3px] pl-3 transition-colors',
                h.level === 2 && 'border-transparent',
                h.level === 3 && 'ml-0 pl-3 border-transparent',
                activeId === h.id && 'border-text'
              )}
            >
              <a
                href={`#${h.id}`}
                className={cn(
                  'block py-0.5 text-text-secondary hover:text-text transition-colors',
                  activeId === h.id && 'text-text'
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
