'use client'

import type { Id } from '@/convex/_generated/dataModel'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface TagSuggestion {
  _id: Id<'tags'>
  name: string
}

interface TagInputProps {
  selectedTags: string[]
  tagInput: string
  onTagInputChange: (value: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  suggestions: TagSuggestion[]
  inputClasses: string
  maxTags?: number
  autoDetected?: boolean
}

export function TagInput({
  selectedTags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  suggestions,
  inputClasses,
  maxTags = 5,
  autoDetected = false,
}: TagInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions
    .filter(
      (tag) =>
        !selectedTags.includes(tag.name.toLowerCase()) &&
        (tagInput === '' || tag.name.toLowerCase().includes(tagInput.toLowerCase()))
    )
    .slice(0, 8)

  // Only allow adding tags that exist in the suggestions list
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    const existsInSuggestions = suggestions.some((s) => s.name.toLowerCase() === trimmedTag)
    if (existsInSuggestions) {
      onAddTag(tag)
    }
    setShowSuggestions(false)
  }

  // Check if the current input matches an existing tag
  const inputMatchesExistingTag = suggestions.some(
    (s) => s.name.toLowerCase() === tagInput.trim().toLowerCase()
  )

  return (
    <div>
      <label htmlFor="tags" className="flex items-center gap-2 text-xs text-text-muted mb-1">
        Tags (max {maxTags})
        {autoDetected && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
            from frontmatter
          </span>
        )}
      </label>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg text-text-secondary text-xs rounded-md border border-border"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text rounded"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      {selectedTags.length < maxTags && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowSuggestions(false), 150)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (inputMatchesExistingTag) {
                    handleAddTag(tagInput)
                  }
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false)
                }
              }}
              placeholder="Search existing tags…"
              className={`flex-1 ${inputClasses}`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => handleAddTag(tagInput)}
              disabled={!inputMatchesExistingTag}
              aria-label="Add tag"
              title={inputMatchesExistingTag ? 'Add tag' : 'Select a tag from the list'}
              className="p-2 text-text-muted hover:text-text disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text rounded"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Tag suggestions dropdown - users can only select existing tags */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-10 mt-1 bg-surface border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAddTag(tag.name)}
                  className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg hover:text-text transition-colors focus-visible:outline-none focus-visible:bg-bg focus-visible:text-text"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
