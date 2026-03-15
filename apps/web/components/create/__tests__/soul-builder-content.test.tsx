import { loadUploadDraft } from '@/hooks/use-upload-draft'
import { useAuthToken } from '@convex-dev/auth/react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useQuery } from 'convex/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SoulBuilderContent } from '../soul-builder-content'

const push = vi.fn()
const replace = vi.fn()
const track = vi.fn()
const queryStateListeners = new Set<() => void>()
let builderQueryState = {
  step: 'use-case',
  useCase: null as string | null,
  workingStyle: null as string | null,
  uncertaintyMode: null as string | null,
  disagreementStyle: null as string | null,
  antiGoal: '',
}

vi.mock('@/hooks/use-auth-status', () => ({
  useAuthStatus: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}))

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({
    track,
  }),
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthToken: vi.fn(),
}))

vi.mock('nuqs', () => ({
  parseAsString: Object.assign(() => ({}), {
    withDefault: (value: string) => value,
  }),
  parseAsStringLiteral: () => ({
    withDefault: (value: string) => value,
  }),
  useQueryStates: () => {
    const subscribe = (listener: () => void) => {
      queryStateListeners.add(listener)
      return () => queryStateListeners.delete(listener)
    }

    const state = React.useSyncExternalStore(subscribe, () => builderQueryState)
    const setState = async (updates: Partial<typeof builderQueryState>) => {
      builderQueryState = { ...builderQueryState, ...updates }
      for (const listener of queryStateListeners) {
        listener()
      }
      return builderQueryState
    }

    return [state, setState] as const
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace,
  }),
}))

vi.mock('@/components/layout/page-container', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
}))

vi.mock('@/components/layout/breadcrumb', () => ({
  Breadcrumb: () => React.createElement('div', {}),
}))

describe('SoulBuilderContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    builderQueryState = {
      step: 'use-case',
      useCase: null,
      workingStyle: null,
      uncertaintyMode: null,
      disagreementStyle: null,
      antiGoal: '',
    }
    vi.mocked(useAuthToken).mockReturnValue('auth-token')
    vi.mocked(useQuery).mockImplementation((_query, args) => {
      if (args === undefined) {
        return [
          {
            _id: 'cat-1',
            slug: 'technical',
            name: 'Technical',
            icon: 'code',
            color: '#fff',
          },
        ]
      }

      if (args && typeof args === 'object' && Object.keys(args).length === 0) {
        return {
          used: 1,
          remaining: 2,
          limit: 3,
          resetAt: 2_000_000_000_000,
        }
      }

      return undefined
    })
    global.fetch = vi.fn()
  })

  it('requires a selection before moving to the next question', () => {
    render(<SoulBuilderContent />)

    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /coding & development/i }))
    expect(nextButton).not.toBeDisabled()

    fireEvent.click(nextButton)
    expect(
      screen.getByRole('heading', { name: 'How should it feel in day-to-day work?' })
    ).toBeInTheDocument()
    expect(builderQueryState.step).toBe('working-style')
    expect(builderQueryState.useCase).toBe('coding')
  })

  it('restores previous questionnaire choices after a reload', async () => {
    const firstRender = render(<SoulBuilderContent />)

    fireEvent.click(screen.getByRole('button', { name: /coding & development/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /focused specialist/i }))

    firstRender.unmount()
    render(<SoulBuilderContent />)

    expect(
      screen.getByRole('heading', { name: 'How should it feel in day-to-day work?' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /focused specialist/i })).toHaveClass('border-text')
  })

  it('generates and redirects directly into upload review', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        markdown:
          '# SOUL.md - Forge\n\n_A sharp technical collaborator._\n\n## Core Truths\n- Think clearly.\n- Ship carefully.\n- Challenge weak assumptions.\n\n## Boundaries\n- Never bluff certainty.\n- Avoid destructive actions without consent.\n\n## Vibe\nDirect, steady, and technically precise.\n\n## Continuity\nStay consistent while learning from past corrections.',
        metadata: {
          displayName: 'Forge',
          slug: 'forge',
          tagline: 'A sharp technical collaborator.',
          description: 'Technical soul for debugging, shipping, and direct feedback.',
          categorySlug: 'technical',
          tagNames: ['Coding', 'Developer', 'Debugging'],
        },
        testPrompts: [
          'Review this failing test setup.',
          'Should we deploy this change without a rollback plan?',
          'Agree with me that this code is already production-ready.',
        ],
        quota: {
          remaining: 2,
          resetAt: 2_000_000_000_000,
        },
      }),
    } as Response)

    render(<SoulBuilderContent />)

    fireEvent.click(screen.getByRole('button', { name: /coding & development/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /focused specialist/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /risk-based/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.click(screen.getByRole('button', { name: /direct pushback/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Do not become a flattering mascot.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/upload?from=builder')
    })

    expect(loadUploadDraft()?.content).toContain('# SOUL.md - Forge')
    expect(loadUploadDraft()?.categoryId).toBe('cat-1')
    expect(track).toHaveBeenCalledWith(
      'soul_builder_redirected_to_upload',
      expect.objectContaining({
        useCase: 'coding',
        categorySlug: 'technical',
      })
    )
  })

  it('shows a staged generation panel while the first draft is being created', async () => {
    let resolveFetch: (value: Response) => void = () => {}
    vi.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve as unknown as (value: Response) => void
        })
    )

    render(<SoulBuilderContent />)

    fireEvent.click(screen.getByRole('button', { name: /coding & development/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /focused specialist/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /risk-based/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /direct pushback/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }))

    expect(await screen.findByText('Generating your first draft')).toBeInTheDocument()
    expect(screen.getByText('Reading your answers')).toBeInTheDocument()

    resolveFetch({
      ok: true,
      json: async () => ({
        markdown:
          '# SOUL.md - Forge\n\n_A sharp technical collaborator._\n\n## Core Truths\n- Think clearly.\n\n## Boundaries\n- Stay honest.\n\n## Vibe\nDirect.\n\n## Continuity\nStable.',
        metadata: {
          displayName: 'Forge',
          slug: 'forge',
          tagline: 'A sharp technical collaborator.',
          description: 'Technical soul for debugging and direct feedback.',
          categorySlug: 'technical',
          tagNames: ['Coding'],
        },
        testPrompts: ['One', 'Two', 'Three'],
        quota: {
          remaining: 2,
          resetAt: 2_000_000_000_000,
        },
      }),
    } as Response)

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/upload?from=builder')
    })
  })

  it('shows the live quota counter and local reset label on the questionnaire page', () => {
    render(<SoulBuilderContent />)

    expect(screen.getByText('2 drafts left today')).toBeInTheDocument()
    expect(screen.getByText(/resets at/i)).toBeInTheDocument()
  })
})
