import type { Id } from '@/convex/_generated/dataModel'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TagInput } from '../tag-input'

const mockId = (id: string) => id as unknown as Id<'tags'>

const mockSuggestions = [
  { _id: mockId('t1'), name: 'productivity' },
  { _id: mockId('t2'), name: 'coding' },
  { _id: mockId('t3'), name: 'creative' },
  { _id: mockId('t4'), name: 'communication' },
  { _id: mockId('t5'), name: 'research' },
]

const defaultProps = {
  selectedTags: [] as string[],
  tagInput: '',
  onTagInputChange: vi.fn(),
  onAddTag: vi.fn(),
  onRemoveTag: vi.fn(),
  suggestions: mockSuggestions,
  inputClasses: 'test-input',
}

describe('TagInput', () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it('renders tag input with label showing max count', () => {
    render(<TagInput {...defaultProps} maxTags={3} />)
    expect(screen.getByText(/Tags \(max 3\)/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search existing tags…')).toBeInTheDocument()
  })

  it('renders selected tags with remove buttons', () => {
    render(<TagInput {...defaultProps} selectedTags={['coding', 'creative']} />)
    expect(screen.getByText('coding')).toBeInTheDocument()
    expect(screen.getByText('creative')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove tag coding' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove tag creative' })).toBeInTheDocument()
  })

  it('shows "from frontmatter" badge when autoDetected', () => {
    render(<TagInput {...defaultProps} autoDetected />)
    expect(screen.getByText('from frontmatter')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Tag addition — only existing tags allowed
  // ---------------------------------------------------------------------------

  it('disables add button when input does not match an existing tag', () => {
    render(<TagInput {...defaultProps} tagInput="nonexistent" />)
    const addButton = screen.getByRole('button', { name: 'Add tag' })
    expect(addButton).toBeDisabled()
  })

  it('enables add button when input matches an existing tag', () => {
    render(<TagInput {...defaultProps} tagInput="coding" />)
    const addButton = screen.getByRole('button', { name: 'Add tag' })
    expect(addButton).not.toBeDisabled()
  })

  it('calls onAddTag when add button is clicked with valid tag', () => {
    const onAddTag = vi.fn()
    render(<TagInput {...defaultProps} tagInput="coding" onAddTag={onAddTag} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(onAddTag).toHaveBeenCalledWith('coding')
  })

  it('does NOT call onAddTag for tags not in suggestions', () => {
    const onAddTag = vi.fn()
    render(<TagInput {...defaultProps} tagInput="fakename" onAddTag={onAddTag} />)
    // The button should be disabled, but let's also verify onAddTag isn't called
    // even if we try to force it via Enter key
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAddTag).not.toHaveBeenCalled()
  })

  it('calls onAddTag on Enter when input matches existing tag', () => {
    const onAddTag = vi.fn()
    render(<TagInput {...defaultProps} tagInput="productivity" onAddTag={onAddTag} />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAddTag).toHaveBeenCalledWith('productivity')
  })

  // ---------------------------------------------------------------------------
  // Tag removal
  // ---------------------------------------------------------------------------

  it('calls onRemoveTag when remove button is clicked', () => {
    const onRemoveTag = vi.fn()
    render(<TagInput {...defaultProps} selectedTags={['coding']} onRemoveTag={onRemoveTag} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag coding' }))
    expect(onRemoveTag).toHaveBeenCalledWith('coding')
  })

  // ---------------------------------------------------------------------------
  // Max tags limit
  // ---------------------------------------------------------------------------

  it('hides input when max tags are selected', () => {
    render(<TagInput {...defaultProps} selectedTags={['a', 'b', 'c', 'd', 'e']} maxTags={5} />)
    expect(screen.queryByPlaceholderText('Search existing tags…')).not.toBeInTheDocument()
  })

  it('shows input when fewer than max tags are selected', () => {
    render(<TagInput {...defaultProps} selectedTags={['a', 'b']} maxTags={5} />)
    expect(screen.getByPlaceholderText('Search existing tags…')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Suggestions dropdown
  // ---------------------------------------------------------------------------

  it('shows filtered suggestions on focus', () => {
    render(<TagInput {...defaultProps} tagInput="" />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.focus(input)

    // All suggestions should appear (none are selected)
    for (const s of mockSuggestions) {
      expect(screen.getByRole('button', { name: s.name })).toBeInTheDocument()
    }
  })

  it('filters suggestions based on input text', () => {
    render(<TagInput {...defaultProps} tagInput="cod" />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.focus(input)

    // Only "coding" matches "cod"
    expect(screen.getByRole('button', { name: 'coding' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'creative' })).not.toBeInTheDocument()
  })

  it('excludes already-selected tags from suggestions', () => {
    render(<TagInput {...defaultProps} selectedTags={['coding']} tagInput="" />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.focus(input)

    // "coding" should not appear in suggestions since it's already selected
    const buttons = screen.getAllByRole('button')
    const suggestionNames = buttons.map((b) => b.textContent)
    expect(suggestionNames).not.toContain('coding')
  })

  it('calls onAddTag when a suggestion is clicked', () => {
    const onAddTag = vi.fn()
    render(<TagInput {...defaultProps} tagInput="" onAddTag={onAddTag} />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.focus(input)

    fireEvent.click(screen.getByRole('button', { name: 'creative' }))
    expect(onAddTag).toHaveBeenCalledWith('creative')
  })

  it('closes suggestions on Escape', () => {
    render(<TagInput {...defaultProps} tagInput="" />)
    const input = screen.getByPlaceholderText('Search existing tags…')
    fireEvent.focus(input)

    // Suggestions visible
    expect(screen.getByRole('button', { name: 'coding' })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })

    // Suggestions should be gone (not visible)
    // Note: after Escape, showSuggestions is set to false so the dropdown disappears
    expect(screen.queryByRole('button', { name: 'coding' })).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Case insensitivity
  // ---------------------------------------------------------------------------

  it('matches tags case-insensitively', () => {
    render(<TagInput {...defaultProps} tagInput="CODING" />)
    // "CODING" should match "coding" in suggestions
    const addButton = screen.getByRole('button', { name: 'Add tag' })
    expect(addButton).not.toBeDisabled()
  })
})
