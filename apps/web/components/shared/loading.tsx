import { PageContainer } from '@/components/layout/page-container'
import { SoulCardGrid } from '@/components/souls/soul-card-grid'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`shimmer rounded-lg ${className}`} />
}

export function SoulCardSkeleton() {
  return (
    <div className="block relative overflow-hidden rounded-lg border border-border bg-surface">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Category badge */}
        <Skeleton className="h-5 w-24 rounded-md mb-4" />

        {/* CLI command */}
        <div className="mt-4 p-3 rounded-md bg-bg border border-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4 mt-1" />
    </div>
  )
}

export function SoulGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SoulCardGrid>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items don't reorder
        <SoulCardSkeleton key={`soul-skeleton-${i}`} />
      ))}
    </SoulCardGrid>
  )
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items don't reorder
        <CategoryCardSkeleton key={`cat-skeleton-${i}`} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <PageContainer paddingY="hero" className="animate-pulse">
      {/* Hero skeleton */}
      <div className="text-center mb-20">
        <Skeleton className="h-16 w-96 mx-auto mb-6" />
        <Skeleton className="h-6 w-64 mx-auto mb-12" />
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-lg" />
      </div>

      {/* Categories skeleton */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <CategoryGridSkeleton />
      </div>

      {/* Souls skeleton */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <SoulGridSkeleton />
      </div>
    </PageContainer>
  )
}

export function SpinnerLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-2',
  }

  return <div className={`${sizes[size]} border-border border-t-text rounded-full animate-spin`} />
}
