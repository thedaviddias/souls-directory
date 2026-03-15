import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VercelToolbarWrapper } from '../vercel-toolbar'

vi.mock('@vercel/toolbar/next', () => ({
  VercelToolbar: () => <div data-testid="vercel-toolbar">Vercel Toolbar</div>,
}))

describe('VercelToolbarWrapper', () => {
  it('does not render on production', () => {
    render(<VercelToolbarWrapper environment="production" />)

    expect(screen.queryByTestId('vercel-toolbar')).not.toBeInTheDocument()
  })

  it('renders on preview', () => {
    render(<VercelToolbarWrapper environment="preview" />)

    expect(screen.getByTestId('vercel-toolbar')).toBeInTheDocument()
  })

  it('renders in local development fallback', () => {
    render(<VercelToolbarWrapper environment="development" />)

    expect(screen.getByTestId('vercel-toolbar')).toBeInTheDocument()
  })
})
