'use client'

import { useCallback, useRef } from 'react'

// =============================================================================
// Types
// =============================================================================

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label': string
  className?: string
  minHeight?: string
  maxHeight?: string
  id?: string
  /** Optional test id (default: markdown-editor). Use "review-editor" in ReviewStep for tests. */
  'data-testid'?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Minimalist markdown editor: controlled textarea with paste-as-plain-text only.
 * Ensures only plain text is inserted on paste (no HTML/scripts).
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  className = '',
  minHeight = 'min-h-128',
  maxHeight = 'max-h-192',
  id,
  'data-testid': dataTestId = 'markdown-editor',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const plain = e.clipboardData.getData('text/plain')
      const ta = textareaRef.current
      if (!ta) {
        onChange(value + plain)
        return
      }
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.slice(0, start) + plain + value.slice(end)
      onChange(next)
      // Restore cursor after pasted content on next tick
      requestAnimationFrame(() => {
        const pos = start + plain.length
        ta.setSelectionRange(pos, pos)
      })
    },
    [value, onChange]
  )

  const baseClasses =
    'w-full p-4 text-sm font-mono bg-surface text-text-secondary resize-y focus:outline-none focus:ring-1 focus:ring-text-secondary border-0'

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={handlePaste}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={false}
      data-testid={dataTestId}
      className={`${baseClasses} ${minHeight} ${maxHeight} ${className}`.trim()}
    />
  )
}
