import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search souls...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-8 py-2 border border-[var(--border)] rounded-lg
                   bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--border)] transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
      )}
    </div>
  )
}
