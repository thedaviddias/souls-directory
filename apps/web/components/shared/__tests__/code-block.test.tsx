import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CodeBlock } from '../code-block'

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
})

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock code="console.log('hello')" />)

    expect(screen.getByText("console.log('hello')")).toBeInTheDocument()
  })

  it('renders language label', () => {
    render(<CodeBlock code="# Test" language="markdown" />)

    expect(screen.getByText('markdown')).toBeInTheDocument()
  })

  it('renders line numbers by default', () => {
    const code = `line 1
line 2
line 3`
    render(<CodeBlock code={code} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides line numbers when showLineNumbers is false', () => {
    render(<CodeBlock code="line 1\nline 2" showLineNumbers={false} />)

    // Line numbers should not be present
    const lineNumbers = screen.queryAllByText(/^[0-9]+$/)
    expect(lineNumbers).toHaveLength(0)
  })

  it('highlights markdown headers', () => {
    const code = `# Header 1
## Header 2
### Header 3`
    render(<CodeBlock code={code} language="markdown" />)

    expect(screen.getByText('# Header 1')).toBeInTheDocument()
    expect(screen.getByText('## Header 2')).toBeInTheDocument()
    expect(screen.getByText('### Header 3')).toBeInTheDocument()
  })

  it('highlights list items', () => {
    render(<CodeBlock code="- Item 1\n- Item 2" language="markdown" />)

    // The dash should be styled differently
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders copy button', () => {
    render(<CodeBlock code="test code" />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<CodeBlock code="test" className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
