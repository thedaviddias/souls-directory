'use client'

import { BaseSearchAutocomplete } from '@/components/search/base-search-autocomplete'
import { soulsByCategoryPath, soulsSearchPath } from '@/lib/routes'

interface SearchAutocompleteProps {
  compact?: boolean
  placeholder?: string
  autoFocus?: boolean
  className?: string
  onNavigate?: () => void
}

export function SearchAutocomplete(props: SearchAutocompleteProps) {
  return (
    <BaseSearchAutocomplete
      {...props}
      categoryPath={soulsByCategoryPath}
      searchPath={soulsSearchPath}
    />
  )
}
