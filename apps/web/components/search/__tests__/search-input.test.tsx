import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchInput } from '../search-input'

// Mock useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput />)
    // Placeholder is rendered as typewriter (one span per character); check form contains it
    const form = screen.getByRole('searchbox').closest('form')
    expect(form).toHaveTextContent('Search souls by name, category, or description...')
  })

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Find a personality..." />)
    // Typewriter splits into one span per character; check form contains the placeholder text
    const form = screen.getByRole('searchbox').closest('form')
    expect(form).toHaveTextContent('Find a personality...')
  })

  it('renders with default value', () => {
    render(<SearchInput defaultValue="coding" />)
    expect(screen.getByDisplayValue('coding')).toBeInTheDocument()
  })

  it('updates value on input', () => {
    render(<SearchInput />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'creative' } })
    expect(screen.getByDisplayValue('creative')).toBeInTheDocument()
  })

  it('shows search button when value is entered', () => {
    render(<SearchInput />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('navigates to souls search on submit', () => {
    render(<SearchInput />)
    const input = screen.getByRole('searchbox')
    const form = input.closest('form')
    fireEvent.change(input, { target: { value: 'coding assistant' } })
    if (form) {
      fireEvent.submit(form)
    }

    expect(mockPush).toHaveBeenCalledWith('/souls?q=coding%20assistant')
  })

  it('does not navigate with empty input', () => {
    mockPush.mockClear()
    render(<SearchInput />)
    const input = screen.getByRole('searchbox')
    const form = input.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    expect(mockPush).not.toHaveBeenCalled()
  })
})
