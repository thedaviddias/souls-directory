import {
  type SoulBuilderExample,
  type SoulBuilderRequest,
  SoulBuilderResponseSchema,
  getSoulBuilderDisagreementStyle,
  getSoulBuilderUncertaintyMode,
  getSoulBuilderUseCase,
  getSoulBuilderWorkingStyle,
} from '@/lib/soul-builder'
import { SLUG_PATTERN, generateSlug } from '@/lib/upload-utils'

const SOUL_BUILDER_HEURISTICS = `
Write a soul that is behaviorally specific, not generic assistant sludge.

Use these principles:
- Prefer a few durable principles over long rule lists.
- Make uncertainty, disagreement, honesty, autonomy, and external-action boundaries explicit.
- Keep the soul distinctive and useful under pressure.
- Avoid manipulative intimacy, flattery, fake warmth, empty wisdom, and roleplay theater.
- Do not write a soul that bluffs certainty or manufactures consensus.
- Make the result publishable on souls.directory without weakening the personality.
`.trim()

export const SOUL_BUILDER_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['markdown', 'metadata', 'testPrompts'],
  properties: {
    markdown: { type: 'string' },
    metadata: {
      type: 'object',
      additionalProperties: false,
      required: ['displayName', 'slug', 'tagline', 'description', 'categorySlug', 'tagNames'],
      properties: {
        displayName: { type: 'string' },
        slug: { type: 'string' },
        tagline: { type: 'string' },
        description: { type: 'string' },
        categorySlug: { type: 'string' },
        tagNames: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
          items: { type: 'string' },
        },
      },
    },
    testPrompts: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
} as const

interface BuildSoulBuilderPromptArgs {
  answers: SoulBuilderRequest
  categories: string[]
  tagNames: string[]
  examples: SoulBuilderExample[]
}

export function buildSoulBuilderPrompt({
  answers,
  categories,
  tagNames,
  examples,
}: BuildSoulBuilderPromptArgs) {
  const useCase = getSoulBuilderUseCase(answers.useCase)
  const workingStyle = getSoulBuilderWorkingStyle(answers.workingStyle)
  const uncertaintyMode = getSoulBuilderUncertaintyMode(answers.uncertaintyMode)
  const disagreementStyle = getSoulBuilderDisagreementStyle(answers.disagreementStyle)

  const instructions = `
You are creating a first-draft SOUL.md for an OpenClaw agent.

${SOUL_BUILDER_HEURISTICS}

Formatting requirements:
- The markdown must start with "# SOUL.md - {Display Name}".
- Add a single italic tagline line directly under the title.
- Use these sections in this exact order:
  1. ## Core Truths
  2. ## Boundaries
  3. ## Vibe
  4. ## Continuity
- Core Truths should contain 3 to 6 bullets.
- Boundaries should be concrete and non-generic.
- Vibe should be short, vivid, and legible on first read.
- Continuity should explain how the soul treats memory, change, and self-updates.

Metadata requirements:
- "displayName" must match the title name.
- "slug" must be lowercase, hyphenated, and derived from the display name.
- "tagline" must be short and distinctive.
- "description" must be concise, clear, and suitable for a listing card.
- "categorySlug" must be one of the provided categories.
- "tagNames" should use 3 to 5 provided tags when possible.
- "testPrompts" must include exactly 3 short prompts:
  1. a normal request
  2. a gray-area or uncertain request
  3. a prompt where the user is wrong or pushing for flattery

Existing souls are only contrast references. Use them to avoid clichés and duplication. Do not imitate or remix their names or taglines.
`.trim()

  const input = JSON.stringify(
    {
      target: {
        useCase: {
          label: useCase.label,
          description: useCase.description,
          categorySlug: useCase.categorySlug,
        },
        workingStyle: {
          label: workingStyle.label,
          description: workingStyle.description,
        },
        uncertaintyMode: {
          label: uncertaintyMode.label,
          description: uncertaintyMode.description,
        },
        disagreementStyle: {
          label: disagreementStyle.label,
          description: disagreementStyle.description,
        },
        antiGoal: answers.antiGoal ?? null,
      },
      allowedCategories: categories,
      availableTags: tagNames,
      contrastExamples: examples,
    },
    null,
    2
  )

  return { instructions, input }
}

export function extractOpenAIText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const outputText = (payload as { output_text?: unknown }).output_text
  if (typeof outputText === 'string' && outputText.trim().length > 0) {
    return outputText.trim()
  }

  const output = Array.isArray((payload as { output?: unknown[] }).output)
    ? (payload as { output: unknown[] }).output
    : []

  const chunks: string[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : []

    for (const entry of content) {
      if (!entry || typeof entry !== 'object') continue
      const type = (entry as { type?: unknown }).type
      const text = (entry as { text?: unknown }).text
      if ((type === 'output_text' || type === 'text') && typeof text === 'string') {
        chunks.push(text)
      }
    }
  }

  const merged = chunks.join('').trim()
  return merged.length > 0 ? merged : null
}

interface NormalizeSoulBuilderResultArgs {
  rawText: string
  validCategories: string[]
  fallbackCategorySlug: string
}

export function normalizeSoulBuilderResult({
  rawText,
  validCategories,
  fallbackCategorySlug,
}: NormalizeSoulBuilderResultArgs) {
  const parsed = JSON.parse(rawText) as unknown
  const result = SoulBuilderResponseSchema.omit({ quota: true }).parse(parsed)

  const displayName = result.metadata.displayName.trim()
  const slugCandidate = result.metadata.slug.trim().toLowerCase()
  const slug = SLUG_PATTERN.test(slugCandidate) ? slugCandidate : generateSlug(displayName)
  const categorySlug = validCategories.includes(result.metadata.categorySlug)
    ? result.metadata.categorySlug
    : fallbackCategorySlug

  return {
    markdown: result.markdown.trim(),
    metadata: {
      displayName,
      slug,
      tagline: result.metadata.tagline.trim(),
      description: result.metadata.description.trim(),
      categorySlug,
      tagNames: result.metadata.tagNames
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5),
    },
    testPrompts: result.testPrompts.map((prompt) => prompt.trim()),
  }
}
