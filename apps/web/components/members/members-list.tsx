'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { MemberCard, type MemberData } from './member-card'

interface MembersListProps {
  members: MemberData[]
  totalCount: number
  page: number
  limit: number
  searchQuery?: string
}

/**
 * Client-side members list with pagination.
 * Handles pagination navigation via URL params.
 */
export function MembersList({
  members,
  totalCount,
  page,
  limit,
  searchQuery = '',
}: MembersListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(totalCount / limit)

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || newPage === page || isPending) return

      const params = new URLSearchParams(searchParams)
      if (newPage === 1) {
        params.delete('page')
      } else {
        params.set('page', newPage.toString())
      }

      startTransition(() => {
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
        router.push(url as Route)
      })
    },
    [page, totalPages, isPending, searchParams, router, pathname]
  )

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (page > 4) pages.push('...')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i)
      }

      if (page < totalPages - 3) pages.push('...')
      if (totalPages > 1) pages.push(totalPages)
    }

    return pages
  }, [page, totalPages])

  return (
    <div className="space-y-8">
      {/* Members Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {members.map((member) => (
          <MemberCard key={member._id} member={member} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs font-mono"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || isPending}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, index) => (
              <span key={`page-${index}-${pageNum}`}>
                {pageNum === '...' ? (
                  <span className="inline-flex w-8 h-8 items-center justify-center text-xs text-text-muted font-mono">
                    ...
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant={page === pageNum ? 'primary' : 'secondary'}
                    size="icon-sm"
                    className="min-w-8 w-8 text-xs font-mono p-0"
                    onClick={() => goToPage(pageNum as number)}
                    disabled={isPending}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )}
              </span>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs font-mono"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || isPending}
            aria-label="Go to next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </nav>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-text border-t-transparent" />
        </div>
      )}

      {/* Results summary */}
      <p className="text-center text-xs text-text-muted font-mono">
        {searchQuery
          ? `Showing ${members.length} of ${totalCount} results for "${searchQuery}"`
          : `Showing ${members.length} of ${totalCount} members`}
        {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
      </p>
    </div>
  )
}
