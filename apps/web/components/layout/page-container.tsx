import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'

const pageContainerVariants = cva('max-w-6xl mx-auto px-6', {
  variants: {
    paddingY: {
      default: 'py-12',
      hero: 'py-16 md:py-24',
      none: '',
    },
  },
  defaultVariants: {
    paddingY: 'default',
  },
})

type PageContainerProps = React.ComponentProps<'div'> & VariantProps<typeof pageContainerVariants>

export function PageContainer({ className, paddingY, children, ...props }: PageContainerProps) {
  return (
    <div className={cn(pageContainerVariants({ paddingY }), className)} {...props}>
      {children}
    </div>
  )
}
