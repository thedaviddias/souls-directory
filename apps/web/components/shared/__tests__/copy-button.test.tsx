import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyButton } from '../copy-button'

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

describe('CopyButton', () => {
  it('renders with default label', () => {
    render(<CopyButton text="test text" />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<CopyButton text="test text" label="Copy code" />)
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('copies text to clipboard on click', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })

    render(<CopyButton text="hello world" />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('hello world')
    })
  })

  it('shows copied state after click', async () => {
    render(<CopyButton text="test" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
      // Flush the microtask queue for the clipboard.writeText promise
      await Promise.resolve()
    })

    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('calls onCopy callback when provided', async () => {
    const onCopy = vi.fn()
    render(<CopyButton text="test" onCopy={onCopy} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(onCopy).toHaveBeenCalled()
    })
  })

  it('shows hint when showTip is true', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })

    render(<CopyButton text="test" showTip />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    // Hint appears after 500ms delay
    await waitFor(
      () => {
        expect(screen.getByText('Paste into your SOUL.md')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  it('resets copied state after timeout', async () => {
    vi.useFakeTimers()
    render(<CopyButton text="test" />)

    // Click and wait for copy
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
      // Run the microtask queue for clipboard promise
      await Promise.resolve()
    })

    expect(screen.getByText('Copied!')).toBeInTheDocument()

    // Fast-forward 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('Copy')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('applies custom className', () => {
    render(<CopyButton text="test" className="custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})
