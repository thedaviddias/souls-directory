'use client'

import { CopyButton } from './copy-button'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language = 'markdown',
  showLineNumbers = true,
  className = '',
}: CodeBlockProps) {
  const lines = code.split('\n')

  return (
    <div className={`relative group rounded-lg overflow-hidden border border-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-elevated border-b border-border">
        <span className="text-xs text-text-muted font-mono">{language}</span>
        <CopyButton
          text={code}
          label="Copy"
          className="opacity-0 group-hover:opacity-100 transition-opacity py-1! px-2! text-xs!"
        />
      </div>

      {/* Code content */}
      <div className="overflow-x-auto bg-surface">
        <pre className="p-4 text-sm font-mono">
          <code>
            {lines.map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are static content
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span className="select-none w-8 pr-4 text-right text-text-muted/40">
                    {i + 1}
                  </span>
                )}
                <span className="text-text-secondary">{highlightLine(line)}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

// Simple markdown syntax highlighting - grayscale theme
function highlightLine(line: string) {
  // Headers
  if (line.startsWith('# ')) {
    return <span className="text-text font-medium">{line}</span>
  }
  if (line.startsWith('## ')) {
    return <span className="text-text font-medium">{line}</span>
  }
  if (line.startsWith('### ')) {
    return <span className="text-text">{line}</span>
  }

  // Bold
  if (line.includes('**')) {
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are static content
          <span key={i} className="text-text font-medium">
            {part.slice(2, -2)}
          </span>
        )
      }
      // biome-ignore lint/suspicious/noArrayIndexKey: parts are static content
      return <span key={i}>{part}</span>
    })
  }

  // Lists
  if (line.startsWith('- ')) {
    return (
      <>
        <span className="text-text-muted">-</span>
        {line.slice(1)}
      </>
    )
  }

  // Comments
  if (line.startsWith('//') || (line.startsWith('#') && !line.startsWith('# '))) {
    return <span className="text-text-muted italic">{line}</span>
  }

  return line
}
