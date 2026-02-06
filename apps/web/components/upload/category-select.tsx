'use client'

import type { Id } from '@/convex/_generated/dataModel'
import { CategoryIcon } from '@/lib/category-icons'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'

interface Category {
  _id: Id<'categories'>
  slug: string
  name: string
  icon: string
  description?: string
}

interface CategorySelectProps {
  categories: Category[]
  selectedCategoryId: Id<'categories'> | null
  onSelect: (categoryId: Id<'categories'> | null) => void
  inputClasses: string
}

export function CategorySelect({
  categories,
  selectedCategoryId,
  onSelect,
  inputClasses,
}: CategorySelectProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId)

  return (
    <div className="relative">
      <button
        type="button"
        id="category-search"
        onClick={() => {
          setShowDropdown(!showDropdown)
          setSearchQuery('')
        }}
        className={`${inputClasses} flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg`}
      >
        <span
          className={`flex items-center gap-2 ${
            selectedCategoryId ? 'text-text' : 'text-text-muted'
          }`}
        >
          {selectedCategory ? (
            <>
              <CategoryIcon slug={selectedCategory.slug} className="w-4 h-4" />
              {selectedCategory.name}
            </>
          ) : (
            'Select a category…'
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`}
        />
      </button>

      {showDropdown && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowDropdown(false)
                }}
                placeholder="Search categories…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg border border-border rounded text-text placeholder-text-muted focus:outline-none focus:border-text-secondary"
                // biome-ignore lint/a11y/noAutofocus: search input in dropdown should autofocus
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* "None" option */}
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-bg transition-colors focus-visible:outline-none focus-visible:bg-bg"
            >
              No category
            </button>

            {filteredCategories.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-muted">No categories match your search</p>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => {
                    onSelect(cat._id)
                    setShowDropdown(false)
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:bg-bg ${
                    selectedCategoryId === cat._id
                      ? 'bg-text/5 text-text font-medium'
                      : 'text-text-secondary hover:bg-bg hover:text-text'
                  }`}
                >
                  <CategoryIcon slug={cat.slug} className="w-4 h-4 shrink-0" />
                  <span>{cat.name}</span>
                  {cat.description && (
                    <span className="text-xs text-text-muted ml-auto hidden sm:inline">
                      {cat.description}
                    </span>
                  )}
                  {selectedCategoryId === cat._id && (
                    <Check className="w-3.5 h-3.5 ml-auto text-text" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowDropdown(false)
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close category dropdown"
        />
      )}
    </div>
  )
}
