import { describe, expect, it } from 'vitest'
import { linkButtonClass, linkButtonVariants } from '../button-styles'

describe('linkButtonVariants', () => {
  it('returns base and primary variant by default', () => {
    const result = linkButtonVariants({})
    expect(result).toContain('inline-flex')
    expect(result).toContain('bg-text')
    expect(result).toContain('text-bg')
  })

  it('applies secondary variant', () => {
    const result = linkButtonVariants({ variant: 'secondary' })
    expect(result).toContain('border')
    expect(result).toContain('bg-surface')
  })

  it('applies sm size', () => {
    const result = linkButtonVariants({ size: 'sm' })
    expect(result).toContain('h-8')
    expect(result).toContain('px-3')
  })
})

describe('linkButtonClass', () => {
  it('returns variant classes without optional args', () => {
    const result = linkButtonClass('primary')
    expect(result).toContain('bg-text')
  })

  it('merges custom className', () => {
    const result = linkButtonClass('primary', 'custom-class')
    expect(result).toContain('custom-class')
  })

  it('applies size when provided', () => {
    const result = linkButtonClass('secondary', undefined, 'sm')
    expect(result).toContain('h-8')
  })
})
