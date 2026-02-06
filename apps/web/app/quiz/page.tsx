/**
 * "What Soul Are You?" recommendation quiz.
 * Asks use case, tone, and model; returns top recommended souls with install commands.
 */

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { SoulQuizContent } from '@/components/quiz/soul-quiz-content'
import { BreadcrumbSchema } from '@/components/seo/json-ld'
import { createMetadata } from '@/lib/seo'

export const metadata = createMetadata({
  title: 'Find Your Soul',
  description:
    'Answer a few questions to get personalized SOUL.md recommendations for your OpenClaw agent. Match your use case, tone, and model.',
  path: '/quiz',
  keywords: ['soul quiz', 'SOUL.md recommendation', 'OpenClaw personality', 'find soul'],
})

export default function QuizPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Find Your Soul', url: '/quiz' }]} />
      <main className="min-h-screen">
        <PageContainer>
          <Breadcrumb items={[{ name: 'Find Your Soul' }]} className="mb-6" />
          <h1 className="text-2xl font-medium text-text mb-2">Find your soul</h1>
          <p className="text-sm text-text-secondary mb-10">
            Answer three short questions and we’ll recommend SOUL.md templates that fit your use
            case, tone, and model.
          </p>
          <SoulQuizContent />
        </PageContainer>
      </main>
    </>
  )
}
