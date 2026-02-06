/**
 * SoulCardGrid - Single source of truth for soul card grid layout.
 * 1 col (default), 2 at sm, 3 at lg, 4 at xl. Use wherever soul cards are listed.
 */

import { cn } from '@/lib/utils'

const soulCardGridClasses = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'

type SoulCardGridProps = React.ComponentProps<'div'>

export function SoulCardGrid({ className, ...props }: SoulCardGridProps) {
  return <div className={cn(soulCardGridClasses, className)} {...props} />
}
