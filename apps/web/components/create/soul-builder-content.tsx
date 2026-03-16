'use client'

import { useAuthToken } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react'
import { SkillCommandCard } from '@/components/home/skill-command-card'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/ui/button'
import type { Id } from '@/convex/_generated/dataModel'
import { useAnalytics } from '@/hooks/use-analytics'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { saveUploadDraftNow } from '@/hooks/use-upload-draft'
import { api } from '@/lib/convex-api'
import { ROUTES } from '@/lib/routes'
import {
  SOUL_BUILDER_DISAGREEMENT_STYLES,
  SOUL_BUILDER_UNCERTAINTY_MODES,
  SOUL_BUILDER_USE_CASES,
  SOUL_BUILDER_WORKING_STYLES,
  type SoulBuilderDisagreementStyleId,
  type SoulBuilderResponse,
  SoulBuilderResponseSchema,
  type SoulBuilderUncertaintyModeId,
  type SoulBuilderUseCaseId,
  type SoulBuilderWorkingStyleId,
} from '@/lib/soul-builder'

const inputClasses =
  'w-full px-3 py-2 rounded-md bg-bg border border-border text-text text-sm placeholder-text-muted focus:outline-none focus:border-text-secondary transition-colors'
const GENERATION_PHASES = [
  {
    label: 'Reading your answers',
    detail: 'Mapping the use case, working style, and personality shape.',
  },
  {
    label: 'Shaping core truths',
    detail: 'Turning your direction into durable principles instead of generic assistant copy.',
  },
  {
    label: 'Defining boundaries',
    detail: 'Making uncertainty, pushback, and limits concrete.',
  },
  {
    label: 'Writing the voice',
    detail: 'Drafting the vibe so the soul sounds distinct on first read.',
  },
  {
    label: 'Preparing the handoff',
    detail: 'Packaging the draft so it drops cleanly into upload.',
  },
] as const
const ANTI_GOAL_EXAMPLES = [
  'Do not become a flattering assistant that always agrees with me.',
  'Do not become a manipulative companion that tries to create dependence.',
  'Do not become generic "helpful AI" sludge with no point of view.',
  'Do not become overly cautious and drown every answer in disclaimers.',
] as const

const QUESTION_STEPS = [
  'use-case',
  'working-style',
  'uncertainty',
  'disagreement',
  'anti-goal',
] as const

type BuilderStep = (typeof QUESTION_STEPS)[number]

const useCaseIds = SOUL_BUILDER_USE_CASES.map((option) => option.id) as [
  SoulBuilderUseCaseId,
  ...SoulBuilderUseCaseId[],
]
const workingStyleIds = SOUL_BUILDER_WORKING_STYLES.map((option) => option.id) as [
  SoulBuilderWorkingStyleId,
  ...SoulBuilderWorkingStyleId[],
]
const uncertaintyModeIds = SOUL_BUILDER_UNCERTAINTY_MODES.map((option) => option.id) as [
  SoulBuilderUncertaintyModeId,
  ...SoulBuilderUncertaintyModeId[],
]
const disagreementStyleIds = SOUL_BUILDER_DISAGREEMENT_STYLES.map((option) => option.id) as [
  SoulBuilderDisagreementStyleId,
  ...SoulBuilderDisagreementStyleId[],
]

export function SoulBuilderContent() {
  const router = useRouter()
  const analytics = useAnalytics()
  const authToken = useAuthToken()
  const { isAuthenticated, isLoading: authLoading } = useAuthStatus()
  const categories = (useQuery(api.categories.list) ?? []) as Array<{
    _id: Id<'categories'>
    slug: string
  }>
  const quota = useQuery(api.soulBuilderUsage.getQuota, isAuthenticated ? {} : 'skip') as
    | SoulBuilderResponse['quota']
    | undefined

  const [builderState, setBuilderState] = useQueryStates(
    {
      step: parseAsStringLiteral(QUESTION_STEPS).withDefault('use-case'),
      useCase: parseAsStringLiteral(useCaseIds),
      workingStyle: parseAsStringLiteral(workingStyleIds),
      uncertaintyMode: parseAsStringLiteral(uncertaintyModeIds),
      disagreementStyle: parseAsStringLiteral(disagreementStyleIds),
      antiGoal: parseAsString.withDefault(''),
    },
    {
      history: 'replace',
      clearOnDefault: true,
    }
  )

  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRouting, startRouting] = useTransition()
  const [generationPhaseIndex, setGenerationPhaseIndex] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(10)

  const useCase = builderState.useCase ?? null
  const workingStyle = builderState.workingStyle ?? null
  const uncertaintyMode = builderState.uncertaintyMode ?? null
  const disagreementStyle = builderState.disagreementStyle ?? null
  const antiGoal = builderState.antiGoal
  const activeStep: BuilderStep = builderState.step
  const questionStepIndex = Math.max(QUESTION_STEPS.indexOf(activeStep), 0)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(ROUTES.login)
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isGenerating) {
      setGenerationPhaseIndex(0)
      setGenerationProgress(10)
      return
    }

    setGenerationPhaseIndex(0)
    setGenerationProgress(10)

    const interval = window.setInterval(() => {
      setGenerationPhaseIndex((current) => Math.min(current + 1, GENERATION_PHASES.length - 1))
      setGenerationProgress((current) => {
        const next = current + 17
        return next > 88 ? 88 : next
      })
    }, 1400)

    return () => {
      window.clearInterval(interval)
    }
  }, [isGenerating])

  const currentCanProceed = useMemo(() => {
    if (activeStep === 'use-case') return !!useCase
    if (activeStep === 'working-style') return !!workingStyle
    if (activeStep === 'uncertainty') return !!uncertaintyMode
    if (activeStep === 'disagreement') return !!disagreementStyle
    return true
  }, [activeStep, disagreementStyle, uncertaintyMode, useCase, workingStyle])

  const reviewResetLabel = useMemo(() => {
    if (!quota) return null
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(quota.resetAt))
  }, [quota])

  const reviewResetTitle = useMemo(() => {
    if (!quota) return undefined
    return 'Daily quota is counted on UTC days and shown here in your local time zone.'
  }, [quota])

  const buildRequestBody = () => {
    if (!useCase || !workingStyle || !uncertaintyMode || !disagreementStyle) return null

    return {
      useCase,
      workingStyle,
      uncertaintyMode,
      disagreementStyle,
      antiGoal: antiGoal.trim() || undefined,
    }
  }

  const goToStep = (step: BuilderStep, history: 'push' | 'replace' = 'push') => {
    void setBuilderState({ step }, { history })
  }

  const goBack = () => {
    const previousIndex = Math.max(questionStepIndex - 1, 0)
    goToStep(QUESTION_STEPS[previousIndex])
  }

  const goNext = () => {
    const nextIndex = Math.min(questionStepIndex + 1, QUESTION_STEPS.length - 1)
    goToStep(QUESTION_STEPS[nextIndex])
  }

  const handleGenerate = async () => {
    const requestBody = buildRequestBody()
    if (!requestBody) return
    if (!authToken) {
      setError('Authentication is still loading. Please try again in a moment.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/soul-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof payload.error === 'string'
            ? payload.error
            : 'Soul generation failed.'
        setError(message)
        return
      }

      const parsed = SoulBuilderResponseSchema.parse(payload)
      const matchedCategory = categories.find(
        (category) => category.slug === parsed.metadata.categorySlug
      )
      const saved = saveUploadDraftNow({
        currentStep: 'review',
        sourceType: 'paste',
        content: parsed.markdown,
        githubUrl: '',
        displayName: parsed.metadata.displayName,
        slug: parsed.metadata.slug,
        tagline: parsed.metadata.tagline,
        description: parsed.metadata.description,
        categoryId: matchedCategory?._id ?? null,
        selectedTags: parsed.metadata.tagNames.map((tag) => tag.toLowerCase()),
        changelog: '',
        versionBump: 'patch',
        isUpdate: false,
      })

      if (!saved) {
        setError('Could not hand off the draft to upload. Please try again.')
        return
      }

      analytics.track('soul_builder_generate', {
        useCase: requestBody.useCase,
        workingStyle: requestBody.workingStyle,
        uncertaintyMode: requestBody.uncertaintyMode,
        disagreementStyle: requestBody.disagreementStyle,
      })
      analytics.track('soul_builder_redirected_to_upload', {
        useCase: requestBody.useCase,
        categorySlug: parsed.metadata.categorySlug,
      })

      startRouting(() => {
        router.push(`${ROUTES.upload}?from=builder`)
      })
    } catch {
      setError('Soul generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAntiGoalExampleClick = (example: (typeof ANTI_GOAL_EXAMPLES)[number]) => {
    const nextValue = antiGoal.trim().length === 0 ? example : `${antiGoal}\n${example}`
    void setBuilderState({ antiGoal: nextValue }, { history: 'replace' })
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        <h1 className="text-xl font-medium text-text">Create a soul</h1>
        <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <PageContainer>
        <Breadcrumb items={[{ name: 'Create a soul' }]} className="mb-6" />

        <div className="space-y-10">
          <div className="space-y-3">
            <div>
              <Badge
                variant="outline"
                size="sm"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                className="whitespace-nowrap bg-surface/80 text-text-secondary"
              >
                Logged-in preview builder
              </Badge>
            </div>
            <h1 className="text-2xl font-medium text-text">Create a soul</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              Answer a few focused questions, generate a first draft, then send it into the upload
              flow for final review and publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <StatusPill>{`Step ${questionStepIndex + 1} of ${QUESTION_STEPS.length}`}</StatusPill>
            {quota && <StatusPill>{quota.remaining} drafts left today</StatusPill>}
            {reviewResetLabel && (
              <StatusPill title={reviewResetTitle}>resets at {reviewResetLabel}</StatusPill>
            )}
          </div>

          {isGenerating ? (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <GenerationStatusPanel
                title="Generating your first draft"
                progress={generationProgress}
                phaseLabel={GENERATION_PHASES[generationPhaseIndex].label}
                phaseDetail={GENERATION_PHASES[generationPhaseIndex].detail}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-8">
              {activeStep === 'use-case' && (
                <QuestionSection
                  title="What do you want this soul to be mainly for?"
                  description="This anchors the category, examples, and first-draft behavior."
                  options={SOUL_BUILDER_USE_CASES}
                  value={useCase}
                  onSelect={(value) =>
                    void setBuilderState(
                      { useCase: value as SoulBuilderUseCaseId },
                      { history: 'replace' }
                    )
                  }
                />
              )}

              {activeStep === 'working-style' && (
                <QuestionSection
                  title="How should it feel in day-to-day work?"
                  description="Choose the working posture, not just the vibe."
                  options={SOUL_BUILDER_WORKING_STYLES}
                  value={workingStyle}
                  onSelect={(value) =>
                    void setBuilderState(
                      { workingStyle: value as SoulBuilderWorkingStyleId },
                      { history: 'replace' }
                    )
                  }
                />
              )}

              {activeStep === 'uncertainty' && (
                <QuestionSection
                  title="What should it do when unsure?"
                  description="This heavily shapes judgment under pressure."
                  options={SOUL_BUILDER_UNCERTAINTY_MODES}
                  value={uncertaintyMode}
                  onSelect={(value) =>
                    void setBuilderState(
                      { uncertaintyMode: value as SoulBuilderUncertaintyModeId },
                      { history: 'replace' }
                    )
                  }
                />
              )}

              {activeStep === 'disagreement' && (
                <QuestionSection
                  title="How should it disagree?"
                  description="Pick the pushback style you want the soul to earn trust with."
                  options={SOUL_BUILDER_DISAGREEMENT_STYLES}
                  value={disagreementStyle}
                  onSelect={(value) =>
                    void setBuilderState(
                      { disagreementStyle: value as SoulBuilderDisagreementStyleId },
                      { history: 'replace' }
                    )
                  }
                />
              )}

              {activeStep === 'anti-goal' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-medium text-text">What should it never become?</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Optional, but high leverage. Name a failure mode or personality anti-goal.
                    </p>
                  </div>

                  <textarea
                    value={antiGoal}
                    onChange={(event) =>
                      void setBuilderState({ antiGoal: event.target.value }, { history: 'replace' })
                    }
                    className={`${inputClasses} min-h-32 resize-y`}
                    placeholder="Example: Do not become a flattering productivity mascot that always agrees with me."
                    maxLength={240}
                  />
                  <p className="text-xs text-text-secondary">
                    Examples are anti-patterns to avoid, not traits to copy.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ANTI_GOAL_EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handleAntiGoalExampleClick(example)}
                        className="inline-flex items-center rounded-full border border-border bg-surface/80 px-3 py-1.5 text-left text-xs text-text-secondary transition-colors hover:border-text-muted hover:text-text"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">{antiGoal.length}/240</p>
                </div>
              )}

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goBack}
                    disabled={activeStep === 'use-case' || isGenerating}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>

                {activeStep !== 'anti-goal' ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={goNext}
                    disabled={!currentCanProceed}
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleGenerate}
                    loading={isGenerating || isRouting}
                    loadingText={isRouting ? 'Opening upload' : 'Generating'}
                  >
                    Generate draft
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-6">
            <div className="space-y-1">
              <h2 className="text-base font-medium text-text">
                Prefer to build inside your agent?
              </h2>
              <p className="text-sm text-text-secondary">
                The local skill is better when you want iterative, context-aware drafting in your
                own workspace.
              </p>
            </div>
            <SkillCommandCard
              triggerLabel="Use the local skill instead"
              dialogTitle="Use the local skill instead"
              dialogDescription="Install SOUL.md Creator to draft or rewrite souls directly inside your agent workflow."
              analyticsLocation="builder"
            />
          </div>
        </div>
      </PageContainer>
    </main>
  )
}

interface QuestionOption {
  id: string
  label: string
  description: string
}

function QuestionSection({
  title,
  description,
  options,
  value,
  onSelect,
}: {
  title: string
  description: string
  options: readonly QuestionOption[]
  value: string | null
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-text">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                selected
                  ? 'border-text bg-elevated text-text'
                  : 'border-border bg-bg text-text-secondary hover:border-text-muted hover:text-text'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="mt-1 text-xs leading-relaxed text-text-muted">
                {option.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Badge
      variant="outline"
      size="sm"
      className="whitespace-nowrap bg-surface/80 text-text-secondary"
      title={title}
    >
      {children}
    </Badge>
  )
}

function GenerationStatusPanel({
  title,
  progress,
  phaseLabel,
  phaseDetail,
}: {
  title: string
  progress: number
  phaseLabel: string
  phaseDetail: string
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-bg p-6 space-y-4"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">{title}</p>
          <p className="mt-1 text-sm text-text-secondary">{phaseLabel}</p>
        </div>
        <span className="text-xs text-text-muted">This usually takes a few seconds</span>
      </div>

      <div className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-text transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-text-muted">{phaseDetail}</p>
          <span className="text-xs text-text-muted">{progress}%</span>
        </div>
      </div>
    </div>
  )
}
