'use client'

import { MarkdownEditor } from '@/components/upload/markdown-editor'
import { ExternalLink, FileText, GitFork, Pencil } from 'lucide-react'
import { useCallback, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

interface GitHubSource {
  owner: string
  repo: string
  url: string
  ref: string
  commit: string
  path?: string
}

interface ReviewStepProps {
  /** The markdown content to display / edit */
  content: string
  /** Called when content changes (fork mode editing) */
  onContentChange: (value: string) => void
  /** Whether this is a fork/remix — enables content editing */
  isForkMode: boolean
  /** Name of the soul being forked (for attribution) */
  forkSourceName?: string
  /** Source type (file upload, GitHub import, or paste) */
  sourceType: 'file' | 'github' | 'paste'
  /** GitHub source metadata (when imported from GitHub) */
  githubSource?: GitHubSource | null
  /** Current file label (filename or path) */
  fileLabel?: string
}

// =============================================================================
// Component
// =============================================================================

export function ReviewStep({
  content,
  onContentChange,
  isForkMode,
  forkSourceName,
  sourceType,
  githubSource,
  fileLabel,
}: ReviewStepProps) {
  const [isEditing, setIsEditing] = useState(isForkMode)

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev)
  }, [])

  const displayLabel =
    sourceType === 'github' && githubSource
      ? `${githubSource.owner}/${githubSource.repo}`
      : sourceType === 'paste'
        ? fileLabel || 'Paste / Type'
        : fileLabel || 'Uploaded file'

  const subtitle = isEditing
    ? `${content.length.toLocaleString()} characters \u00b7 Editing`
    : `${content.length.toLocaleString()} characters \u00b7 Read-only preview`

  return (
    <section className="space-y-4" data-testid="review-step">
      {/* Fork attribution */}
      {isForkMode && forkSourceName && (
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-3">
          <GitFork className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
          <p className="text-sm text-text-secondary">
            Forking from <span className="text-text font-medium">{forkSourceName}</span> — edit the
            content below to make it your own.
          </p>
        </div>
      )}

      {/* File info bar */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-text-muted" />
          <div>
            <p className="text-sm text-text font-medium">{displayLabel}</p>
            <p className="text-xs text-text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isForkMode && (
            <button
              type="button"
              onClick={toggleEditing}
              className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors"
              data-testid="toggle-edit-button"
            >
              <Pencil className="w-3 h-3" />
              {isEditing ? 'Preview' : 'Edit'}
            </button>
          )}
          {sourceType === 'github' && githubSource && (
            <a
              href={githubSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors"
            >
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Content: editable editor (paste-as-plain-text) or read-only preview */}
      {isEditing ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <MarkdownEditor
            value={content}
            onChange={onContentChange}
            aria-label="Soul content editor"
            minHeight="min-h-128"
            maxHeight="max-h-192"
            data-testid="review-editor"
          />
        </div>
      ) : (
        <div className="max-h-128 overflow-y-auto rounded-lg border border-border">
          <div className="overflow-x-auto bg-surface">
            <pre className="p-4 text-sm font-mono" data-testid="review-preview">
              <code>
                {content.split('\n').map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: lines are static display content
                  <div key={i} className="flex">
                    <span className="select-none w-10 pr-4 text-right text-text-muted/40 text-xs leading-relaxed">
                      {i + 1}
                    </span>
                    <span className="text-text-secondary leading-relaxed">{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      )}
    </section>
  )
}
