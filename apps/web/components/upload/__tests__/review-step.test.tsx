import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReviewStep } from '../review-step'

const defaultContent = '# My Soul\n\n_A helpful assistant_\n\n## Vibe\nFriendly and warm.'

describe('ReviewStep', () => {
  // ===========================================================================
  // Read-only mode (standard upload)
  // ===========================================================================

  describe('read-only mode (non-fork)', () => {
    it('renders content as read-only preview by default', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
          fileLabel="SOUL.md"
        />
      )

      expect(screen.getByTestId('review-preview')).toBeInTheDocument()
      expect(screen.queryByTestId('review-editor')).not.toBeInTheDocument()
    })

    it('displays file label and character count', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
          fileLabel="SOUL.md"
        />
      )

      expect(screen.getByText('SOUL.md')).toBeInTheDocument()
      expect(screen.getByText(/characters/)).toBeInTheDocument()
      expect(screen.getByText(/Read-only preview/)).toBeInTheDocument()
    })

    it('does not show edit toggle button when not in fork mode', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
        />
      )

      expect(screen.queryByTestId('toggle-edit-button')).not.toBeInTheDocument()
    })

    it('does not show fork attribution when not in fork mode', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
        />
      )

      expect(screen.queryByText(/Forking from/)).not.toBeInTheDocument()
    })

    it('shows GitHub link when source is github', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="github"
          githubSource={{
            owner: 'testowner',
            repo: 'testrepo',
            url: 'https://github.com/testowner/testrepo',
            ref: 'main',
            commit: 'abc1234',
          }}
        />
      )

      expect(screen.getByText('testowner/testrepo')).toBeInTheDocument()
      expect(screen.getByText('View on GitHub')).toBeInTheDocument()
    })

    it('renders line numbers in preview', () => {
      render(
        <ReviewStep
          content={'line one\nline two\nline three'}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
        />
      )

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('uses default label when fileLabel is not provided', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={false}
          sourceType="file"
        />
      )

      expect(screen.getByText('Uploaded file')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Fork mode (editable)
  // ===========================================================================

  describe('fork mode', () => {
    it('starts in editing mode by default', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          forkSourceName="Test Soul"
          sourceType="file"
        />
      )

      expect(screen.getByTestId('review-editor')).toBeInTheDocument()
      expect(screen.queryByTestId('review-preview')).not.toBeInTheDocument()
    })

    it('shows fork attribution with source name', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          forkSourceName="Test Soul"
          sourceType="file"
        />
      )

      expect(screen.getByText(/Forking from/)).toBeInTheDocument()
      expect(screen.getByText('Test Soul')).toBeInTheDocument()
    })

    it('does not show fork attribution when forkSourceName is not provided', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          sourceType="file"
        />
      )

      expect(screen.queryByText(/Forking from/)).not.toBeInTheDocument()
    })

    it('shows edit/preview toggle button', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          forkSourceName="Test Soul"
          sourceType="file"
        />
      )

      const toggleBtn = screen.getByTestId('toggle-edit-button')
      expect(toggleBtn).toBeInTheDocument()
      // Starts in editing mode, so toggle says "Preview"
      expect(toggleBtn).toHaveTextContent('Preview')
    })

    it('toggles between edit and preview mode', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          forkSourceName="Test Soul"
          sourceType="file"
        />
      )

      // Starts in edit mode
      expect(screen.getByTestId('review-editor')).toBeInTheDocument()

      // Click to switch to preview
      fireEvent.click(screen.getByTestId('toggle-edit-button'))
      expect(screen.getByTestId('review-preview')).toBeInTheDocument()
      expect(screen.queryByTestId('review-editor')).not.toBeInTheDocument()
      expect(screen.getByTestId('toggle-edit-button')).toHaveTextContent('Edit')

      // Click to switch back to edit
      fireEvent.click(screen.getByTestId('toggle-edit-button'))
      expect(screen.getByTestId('review-editor')).toBeInTheDocument()
      expect(screen.queryByTestId('review-preview')).not.toBeInTheDocument()
    })

    it('calls onContentChange when content is edited', () => {
      const onContentChange = vi.fn()
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={onContentChange}
          isForkMode={true}
          forkSourceName="Test Soul"
          sourceType="file"
        />
      )

      const editor = screen.getByTestId('review-editor')
      fireEvent.change(editor, { target: { value: '# Modified Content' } })
      expect(onContentChange).toHaveBeenCalledWith('# Modified Content')
    })

    it('shows "Editing" in subtitle when in edit mode', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          sourceType="file"
        />
      )

      expect(screen.getByText(/Editing/)).toBeInTheDocument()
    })

    it('shows "Read-only preview" in subtitle when toggled to preview', () => {
      render(
        <ReviewStep
          content={defaultContent}
          onContentChange={vi.fn()}
          isForkMode={true}
          sourceType="file"
        />
      )

      fireEvent.click(screen.getByTestId('toggle-edit-button'))
      expect(screen.getByText(/Read-only preview/)).toBeInTheDocument()
    })
  })
})
