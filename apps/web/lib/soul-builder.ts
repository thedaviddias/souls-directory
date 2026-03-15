import { z } from 'zod'

export const SOUL_BUILDER_DAILY_LIMIT = 3

export const SOUL_BUILDER_USE_CASES = [
  {
    id: 'coding',
    label: 'Coding & development',
    description: 'Build, debug, review, and ship software with strong judgment.',
    categorySlug: 'technical',
  },
  {
    id: 'business',
    label: 'Business & operations',
    description: 'Plan, prioritize, and drive work forward without fluff.',
    categorySlug: 'professional',
  },
  {
    id: 'creative',
    label: 'Creative writing & ideation',
    description: 'Generate ideas, shape voice, and improve drafts.',
    categorySlug: 'creative',
  },
  {
    id: 'research',
    label: 'Research & analysis',
    description: 'Compare options, investigate details, and synthesize clearly.',
    categorySlug: 'research',
  },
  {
    id: 'teaching',
    label: 'Teaching & learning',
    description: 'Explain, coach, and build understanding step by step.',
    categorySlug: 'educational',
  },
  {
    id: 'support',
    label: 'Support & reflection',
    description: 'Stay calm, grounded, and useful without becoming manipulative.',
    categorySlug: 'wellness',
  },
] as const

export const SOUL_BUILDER_WORKING_STYLES = [
  {
    id: 'colleague',
    label: 'Pragmatic colleague',
    description: 'Collaborative, grounded, and momentum-oriented.',
  },
  {
    id: 'specialist',
    label: 'Focused specialist',
    description: 'Precise, opinionated, and domain-strong.',
  },
  {
    id: 'coach',
    label: 'Coach & mentor',
    description: 'Structured, encouraging, and growth-oriented.',
  },
  {
    id: 'sparring-partner',
    label: 'Sparring partner',
    description: 'Sharpens weak thinking and pushes for better decisions.',
  },
] as const

export const SOUL_BUILDER_UNCERTAINTY_MODES = [
  {
    id: 'ask-first',
    label: 'Ask first',
    description: 'Clarify before acting whenever uncertainty appears.',
  },
  {
    id: 'try-first',
    label: 'Try first',
    description: 'Make the best safe attempt before interrupting the user.',
  },
  {
    id: 'risk-based',
    label: 'Risk-based',
    description: 'Act on low-risk tasks, slow down on high-risk ones.',
  },
] as const

export const SOUL_BUILDER_DISAGREEMENT_STYLES = [
  {
    id: 'gentle',
    label: 'Gentle pushback',
    description: 'Challenge softly while preserving rapport.',
  },
  {
    id: 'direct',
    label: 'Direct pushback',
    description: 'Call out weak assumptions plainly and early.',
  },
  {
    id: 'selective',
    label: 'Selective pushback',
    description: 'Mostly supportive, but firm when the stakes rise.',
  },
] as const

export type SoulBuilderUseCaseId = (typeof SOUL_BUILDER_USE_CASES)[number]['id']
export type SoulBuilderWorkingStyleId = (typeof SOUL_BUILDER_WORKING_STYLES)[number]['id']
export type SoulBuilderUncertaintyModeId = (typeof SOUL_BUILDER_UNCERTAINTY_MODES)[number]['id']
export type SoulBuilderDisagreementStyleId = (typeof SOUL_BUILDER_DISAGREEMENT_STYLES)[number]['id']

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

export const SoulBuilderRequestSchema = z.object({
  useCase: z.enum(useCaseIds),
  workingStyle: z.enum(workingStyleIds),
  uncertaintyMode: z.enum(uncertaintyModeIds),
  disagreementStyle: z.enum(disagreementStyleIds),
  antiGoal: z
    .string()
    .trim()
    .max(240, 'Anti-goal must be 240 characters or less.')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export const SoulBuilderResponseSchema = z.object({
  markdown: z.string().min(1),
  metadata: z.object({
    displayName: z.string().min(1),
    slug: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    categorySlug: z.string().min(1),
    tagNames: z.array(z.string().min(1)).min(1).max(5),
  }),
  testPrompts: z.array(z.string().min(1)).length(3),
  quota: z.object({
    remaining: z.number().int().min(0),
    resetAt: z.number().int().positive(),
  }),
})

export type SoulBuilderRequest = z.infer<typeof SoulBuilderRequestSchema>
export type SoulBuilderResponse = z.infer<typeof SoulBuilderResponseSchema>

export interface SoulBuilderExample {
  name: string
  tagline: string
  category: string
}

export function getSoulBuilderUseCase(id: SoulBuilderUseCaseId) {
  return SOUL_BUILDER_USE_CASES.find((option) => option.id === id) ?? SOUL_BUILDER_USE_CASES[0]
}

export function getSoulBuilderWorkingStyle(id: SoulBuilderWorkingStyleId) {
  return (
    SOUL_BUILDER_WORKING_STYLES.find((option) => option.id === id) ?? SOUL_BUILDER_WORKING_STYLES[0]
  )
}

export function getSoulBuilderUncertaintyMode(id: SoulBuilderUncertaintyModeId) {
  return (
    SOUL_BUILDER_UNCERTAINTY_MODES.find((option) => option.id === id) ??
    SOUL_BUILDER_UNCERTAINTY_MODES[0]
  )
}

export function getSoulBuilderDisagreementStyle(id: SoulBuilderDisagreementStyleId) {
  return (
    SOUL_BUILDER_DISAGREEMENT_STYLES.find((option) => option.id === id) ??
    SOUL_BUILDER_DISAGREEMENT_STYLES[0]
  )
}
