/**
 * Shared link/button styles for consistent primary and secondary CTAs.
 * Primary matches the header "Sign up" button; secondary is the outline style.
 */

import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const linkButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-text text-bg hover:bg-text/90',
        secondary:
          'border border-border bg-surface text-text-secondary hover:border-text-muted hover:text-text',
      },
      size: {
        default: 'text-sm px-4 py-2.5',
        sm: 'text-sm h-8 px-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export type LinkButtonVariants = VariantProps<typeof linkButtonVariants>

/** Convenience: merge variant with optional className */
export function linkButtonClass(
  variant: LinkButtonVariants['variant'],
  className?: string,
  size?: LinkButtonVariants['size']
): string {
  return cn(linkButtonVariants({ variant, size }), className)
}
