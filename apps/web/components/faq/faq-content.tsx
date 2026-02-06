'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { faqCategories, faqItems } from '@/lib/faq-data'
import { cn } from '@/lib/utils'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export function FAQContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredItems = activeCategory
    ? faqItems.filter((item) => item.category === activeCategory)
    : faqItems

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <main className="min-h-screen">
      <PageContainer paddingY="hero">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'FAQ' }]} className="mb-8" />

        {/* Hero */}
        <header className="text-center mb-16">
          <h1 className="text-2xl md:text-3xl font-medium text-text mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-text-secondary max-w-xl mx-auto">
            Everything you need to know about souls.directory
          </p>
        </header>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`
              px-3 py-1.5 rounded-md text-xs transition-colors
              ${
                !activeCategory
                  ? 'bg-surface border border-text-secondary text-text'
                  : 'border border-border text-text-secondary hover:text-text hover:border-text-muted'
              }
            `}
          >
            All
          </button>
          {faqCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`
                px-3 py-1.5 rounded-md text-xs transition-colors
                ${
                  activeCategory === category
                    ? 'bg-surface border border-text-secondary text-text'
                    : 'border border-border text-text-secondary hover:text-text hover:border-text-muted'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const globalIndex = faqItems.indexOf(item)
            const isOpen = openIndex === globalIndex

            return (
              <div
                key={item.question}
                className="bg-surface border border-border rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(globalIndex)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-elevated/50 transition-colors"
                >
                  <div>
                    <span className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">
                      {item.category}
                    </span>
                    <span className="text-sm text-text">{item.question}</span>
                  </div>
                  <span
                    className={cn(
                      'text-text-muted ml-4 shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>

                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Still have questions */}
        <section className="text-center mt-16 py-12 border-t border-border">
          <h2 className="text-lg font-medium text-text mb-3">Still have questions?</h2>
          <p className="text-sm text-text-secondary mb-6">We&apos;re here to help.</p>
          <a
            href="https://github.com/thedaviddias/souls-directory/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md border border-border text-sm text-text-secondary hover:text-text hover:border-text-muted transition-colors inline-flex items-center gap-1.5"
          >
            Open a Discussion
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </section>
      </PageContainer>
    </main>
  )
}
