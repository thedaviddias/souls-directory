import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFileUpload } from '../use-file-upload'

function TestWrapper({ sourceType }: { sourceType: 'file' | 'github' | 'paste' }) {
  const {
    content,
    handleFileSelect,
    fileInputRef,
    sourceValidation,
    clearFiles,
    setContent,
    files,
    normalizedFiles,
    isDragging,
    handleDragOver,
    handleDragLeave,
    removeFile,
    markdownFiles,
    goToNextFile,
    currentFileIndex,
    hasNextFile,
  } = useFileUpload(sourceType)
  return (
    <div>
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} data-testid="file-input" />
      <span data-testid="content">{content}</span>
      <span data-testid="ready">{String(sourceValidation.ready)}</span>
      <span data-testid="issues">{sourceValidation.issues.join(',')}</span>
      <span data-testid="file-count">{files.length}</span>
      <span data-testid="is-dragging">{String(isDragging)}</span>
      <button type="button" onClick={clearFiles}>
        Clear
      </button>
      <button type="button" onClick={() => setContent('github-content')}>
        Set content
      </button>
      <div data-testid="drop-zone" onDragOver={handleDragOver} onDragLeave={handleDragLeave} />
      {normalizedFiles.map((nf, i) => (
        <button key={`${nf.path}-${i}`} type="button" onClick={() => removeFile(i)}>
          Remove {i}
        </button>
      ))}
      {hasNextFile && (
        <button type="button" onClick={goToNextFile}>
          Next file
        </button>
      )}
      <span data-testid="current-index">{currentFileIndex}</span>
      <span data-testid="markdown-count">{markdownFiles.length}</span>
    </div>
  )
}

describe('useFileUpload', () => {
  let readAsTextMock: (blob: Blob) => void

  beforeEach(() => {
    readAsTextMock = vi.fn()
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader,
      blob: Blob
    ) {
      readAsTextMock(blob)
      const result = blob instanceof File ? `# content of ${(blob as File).name}` : ''
      queueMicrotask(() => {
        Object.defineProperty(this, 'result', { value: result, writable: false })
        this.onload?.({ target: this } as ProgressEvent<FileReader>)
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with empty state', () => {
    render(<TestWrapper sourceType="file" />)
    expect(screen.getByTestId('content')).toHaveTextContent('')
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    expect(screen.getByTestId('file-count')).toHaveTextContent('0')
    expect(screen.getByTestId('is-dragging')).toHaveTextContent('false')
  })

  it('file mode: sourceValidation.ready is false without files', () => {
    render(<TestWrapper sourceType="file" />)
    expect(screen.getByTestId('issues')).toHaveTextContent(/Add at least one file/)
  })

  it('github mode: sourceValidation.ready depends on content', () => {
    render(<TestWrapper sourceType="github" />)
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    act(() => {
      screen.getByText('Set content').click()
    })
    expect(screen.getByTestId('content')).toHaveTextContent('github-content')
    expect(screen.getByTestId('ready')).toHaveTextContent('true')
  })

  it('paste mode: sourceValidation.ready is true when content is non-empty', () => {
    render(<TestWrapper sourceType="paste" />)
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    act(() => {
      screen.getByText('Set content').click()
    })
    expect(screen.getByTestId('content')).toHaveTextContent('github-content')
    expect(screen.getByTestId('ready')).toHaveTextContent('true')
  })

  it('paste mode: sourceValidation.ready is false when content is empty', () => {
    render(<TestWrapper sourceType="paste" />)
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    expect(screen.getByTestId('content')).toHaveTextContent('')
  })

  it('handleFileSelect adds files and reads markdown content', async () => {
    render(<TestWrapper sourceType="file" />)
    const input = screen.getByTestId('file-input')
    const file = new File(['# hello'], 'test.md', { type: 'text/markdown' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByTestId('file-count')).toHaveTextContent('1')
    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveTextContent(/content of test\.md/)
    })
    expect(readAsTextMock).toHaveBeenCalledWith(file)
  })

  it('clearFiles resets files and content', async () => {
    render(<TestWrapper sourceType="file" />)
    const input = screen.getByTestId('file-input')
    const file = new File(['# a'], 'a.md', { type: 'text/markdown' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('content').textContent).toBeTruthy()
    })
    act(() => {
      screen.getByText('Clear').click()
    })
    expect(screen.getByTestId('file-count')).toHaveTextContent('0')
    expect(screen.getByTestId('content')).toHaveTextContent('')
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
  })

  it('setContent updates content for current file index', () => {
    render(<TestWrapper sourceType="github" />)
    act(() => {
      screen.getByText('Set content').click()
    })
    expect(screen.getByTestId('content')).toHaveTextContent('github-content')
  })

  it('handleDragOver sets isDragging to true', () => {
    render(<TestWrapper sourceType="file" />)
    const zone = screen.getByTestId('drop-zone')
    fireEvent.dragOver(zone)
    expect(screen.getByTestId('is-dragging')).toHaveTextContent('true')
  })

  it('handleDragLeave sets isDragging to false', () => {
    render(<TestWrapper sourceType="file" />)
    const zone = screen.getByTestId('drop-zone')
    fireEvent.dragOver(zone)
    expect(screen.getByTestId('is-dragging')).toHaveTextContent('true')
    fireEvent.dragLeave(zone)
    expect(screen.getByTestId('is-dragging')).toHaveTextContent('false')
  })

  it('removeFile removes file at index', async () => {
    render(<TestWrapper sourceType="file" />)
    const input = screen.getByTestId('file-input')
    const file = new File(['x'], 'f.md', { type: 'text/markdown' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1')
    })
    act(() => {
      screen.getByText('Remove 0').click()
    })
    expect(screen.getByTestId('file-count')).toHaveTextContent('0')
  })

  it('goToNextFile advances currentFileIndex when multiple markdown files', async () => {
    render(<TestWrapper sourceType="file" />)
    const input = screen.getByTestId('file-input')
    const file1 = new File(['# one'], 'one.md', { type: 'text/markdown' })
    const file2 = new File(['# two'], 'two.md', { type: 'text/markdown' })
    fireEvent.change(input, { target: { files: [file1, file2] } })
    await waitFor(() => {
      expect(screen.getByTestId('markdown-count')).toHaveTextContent('2')
    })
    expect(screen.getByTestId('current-index')).toHaveTextContent('0')
    expect(screen.getByText('Next file')).toBeInTheDocument()
    act(() => {
      screen.getByText('Next file').click()
    })
    expect(screen.getByTestId('current-index')).toHaveTextContent('1')
  })
})
