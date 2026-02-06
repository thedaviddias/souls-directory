'use client'

/**
 * Interactive quiz: use case → tone → model → recommended souls with install commands.
 */

import { SoulCard } from '@/components/souls/soul-card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/convex-api'
import { ROUTES } from '@/lib/routes'
import type { Soul } from '@/types'
import { useQuery } from 'convex/react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const USE_CASES = [
  { id: 'coding', label: 'Coding & development', categorySlug: 'technical' },
  { id: 'personal', label: 'Personal assistant & life', categorySlug: 'professional' },
  { id: 'creative', label: 'Creative writing & brainstorming', categorySlug: 'creative' },
  { id: 'business', label: 'Business & ops', categorySlug: 'professional' },
] as const

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'playful', label: 'Playful' },
  { id: 'minimal', label: 'Minimal' },
] as const

const MODELS = [
  { id: 'gemini-3-flash', label: 'Gemini 3 Flash' },
  { id: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { id: 'claude-opus-4.5', label: 'Claude Opus 4.5' },
  { id: 'kimi-k2.5', label: 'Kimi K2.5' },
  { id: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'minimax-m2.1', label: 'MiniMax M2.1' },
  { id: 'gpt-5.2', label: 'GPT-5.2' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'grok-4.1', label: 'Grok 4.1' },
  { id: 'any', label: 'Any / other' },
] as const

function toSoul(item: {
  soul: {
    _id: string
    slug: string
    name: string
    tagline: string
    description?: string
    stats: { downloads: number; stars: number; upvotes?: number; versions: number }
    testedWithModels?: Array<{ model: string }>
    featured?: boolean
    createdAt: number
    updatedAt: number
  }
  category: { slug: string; name: string } | null
}): Soul {
  const { soul, category } = item
  return {
    id: soul._id,
    slug: soul.slug,
    ownerHandle: (soul as { ownerHandle?: string | null }).ownerHandle ?? '',
    name: soul.name,
    tagline: soul.tagline,
    description: soul.description ?? '',
    content: '',
    category_id: category?.slug ?? '',
    downloads: soul.stats.downloads,
    stars: soul.stats.stars,
    upvotes: soul.stats.upvotes ?? 0,
    versions: soul.stats.versions,
    featured: soul.featured ?? false,
    tested_with: (soul.testedWithModels ?? []).map((t) => t.model),
    created_at: new Date(soul.createdAt).toISOString(),
    updated_at: new Date(soul.updatedAt).toISOString(),
    category: category
      ? {
          id: category.slug,
          slug: category.slug,
          name: category.name,
          description: '',
          icon: '',
          color: '',
        }
      : undefined,
  }
}

export function SoulQuizContent() {
  const [step, setStep] = useState(1)
  const [useCase, setUseCase] = useState<(typeof USE_CASES)[number] | null>(null)
  const [tone, setTone] = useState<(typeof TONES)[number]['id'] | null>(null)
  const [model, setModel] = useState<(typeof MODELS)[number]['id'] | null>(null)

  const categorySlug = useCase?.categorySlug
  const modelFilter = model && model !== 'any' ? model : undefined

  const listResult = useQuery(
    api.souls.list,
    step === 4 && categorySlug
      ? { categorySlug, model: modelFilter, limit: 6, sort: 'popular' }
      : 'skip'
  )

  const souls: Soul[] =
    listResult && 'items' in listResult && Array.isArray(listResult.items)
      ? (
          listResult.items as Array<{
            soul: Parameters<typeof toSoul>[0]['soul']
            category: Parameters<typeof toSoul>[0]['category']
          }>
        ).map((row) => toSoul(row))
      : []

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const canProceed =
    (step === 1 && useCase) || (step === 2 && tone) || (step === 3 && model !== null)

  return (
    <div className="space-y-10">
      {/* Steps 1–3: questions */}
      {step <= 3 && (
        <>
          <div className="flex gap-2 text-sm text-text-muted">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={
                  s === step ? 'text-text font-medium' : s < step ? 'text-text-secondary' : ''
                }
              >
                {s === step ? `${s}.` : s < step ? <Check className="inline w-4 h-4" /> : s}
              </span>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-lg font-medium text-text mb-4">
                What do you use your agent for?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {USE_CASES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUseCase(opt)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      useCase?.id === opt.id
                        ? 'border-text bg-elevated text-text'
                        : 'border-border bg-surface text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-medium text-text mb-4">What tone do you prefer?</h2>
              <div className="flex flex-wrap gap-3">
                {TONES.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTone(opt.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      tone === opt.id
                        ? 'border-text bg-elevated text-text'
                        : 'border-border bg-surface text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-medium text-text mb-4">What model are you using?</h2>
              <div className="flex flex-wrap gap-3">
                {MODELS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setModel(opt.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      model === opt.id
                        ? 'border-text bg-elevated text-text'
                        : 'border-border bg-surface text-text-secondary hover:border-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleNext}
              disabled={!canProceed}
            >
              {step < 3 ? 'Next' : 'Get recommendations'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Step 4: results */}
      {step === 4 && (
        <div>
          <div className="flex items-center gap-2 text-text mb-4">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-medium">Your recommendations</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Based on {useCase?.label}, {TONES.find((t) => t.id === tone)?.label} tone, and{' '}
            {MODELS.find((m) => m.id === model)?.label}. Install any soul with the command below.
          </p>
          {souls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {souls.map((soul) => (
                <SoulCard key={soul.id} soul={soul} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted mb-6">
              No souls match this combination. Try{' '}
              <Link href={ROUTES.souls} className="text-text-secondary hover:underline">
                browsing all souls
              </Link>{' '}
              or change your answers.
            </p>
          )}
          <div className="mt-8 flex gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setStep(1)}>
              Start over
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={ROUTES.souls}>Browse all souls</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
