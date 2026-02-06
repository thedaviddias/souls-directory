/**
 * FAQ Page - souls.directory
 *
 * Server Component wrapper for SEO metadata.
 * Client-side interactivity handled by FAQContent component.
 */

import { FAQContent } from '@/components/faq/faq-content'
import { BreadcrumbSchema, FAQSchema } from '@/components/seo/json-ld'
import { faqItems } from '@/lib/faq-data'
import { createMetadata } from '@/lib/seo'

export const metadata = createMetadata({
  title: 'FAQ - SOUL.md Templates & OpenClaw Questions Answered',
  description:
    'Frequently asked questions about souls.directory. Learn how to use SOUL.md personality templates for OpenClaw, contribute your own souls, and more.',
  path: '/faq',
  noSuffix: true,
  keywords: ['FAQ', 'help', 'SOUL.md guide', 'how to use', 'OpenClaw help', 'AI personality help'],
})

export default function FAQPage() {
  return (
    <>
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema items={[{ name: 'FAQ', url: '/faq' }]} />
      <FAQContent />
    </>
  )
}
