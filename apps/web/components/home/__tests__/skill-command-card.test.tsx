import { useAnalytics } from '@/hooks/use-analytics'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  SOUL_MD_CREATOR_COMMAND,
  SOUL_MD_CREATOR_REPO_URL,
  SkillCommandCard,
} from '../skill-command-card'

vi.mock('@/hooks/use-analytics', () => ({
  useAnalytics: vi.fn(),
}))

describe('SkillCommandCard', () => {
  it('tracks button click and modal open', async () => {
    const track = vi.fn()
    vi.mocked(useAnalytics).mockReturnValue({ track })

    render(<SkillCommandCard />)

    fireEvent.click(screen.getByRole('button', { name: 'Create your own' }))

    expect(track).toHaveBeenCalledWith('homepage_skill_cta_click', { location: 'hero' })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(track).toHaveBeenCalledWith('homepage_skill_modal_open', { location: 'hero' })
  })

  it('opens the modal with the install command and repo link', async () => {
    vi.mocked(useAnalytics).mockReturnValue({ track: vi.fn() })
    render(<SkillCommandCard />)

    fireEvent.click(screen.getByRole('button', { name: 'Create your own' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create your own' })).toBeInTheDocument()
    expect(screen.getByText(`$ ${SOUL_MD_CREATOR_COMMAND}`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view source/i })).toHaveAttribute(
      'href',
      SOUL_MD_CREATOR_REPO_URL
    )
  })

  it('copies the command and shows copied state', async () => {
    const track = vi.fn()
    const writeText = vi.fn(() => Promise.resolve())
    vi.mocked(useAnalytics).mockReturnValue({ track })
    Object.assign(navigator, { clipboard: { writeText } })

    render(<SkillCommandCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Create your own' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy SOUL.md Creator install command' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(SOUL_MD_CREATOR_COMMAND)
    })

    expect(track).toHaveBeenCalledWith('homepage_skill_command_copy', { location: 'hero' })
    expect(screen.getByText('Copied')).toBeInTheDocument()
  })
})
