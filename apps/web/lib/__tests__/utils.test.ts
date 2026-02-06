import { describe, expect, it } from 'vitest'
import { cn } from '../utils'

describe('cn (class name merge)', () => {
  it('should merge simple class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded')
    expect(result).toBe('base included')
  })

  it('should handle undefined values', () => {
    const result = cn('base', undefined, 'after')
    expect(result).toBe('base after')
  })

  it('should handle null values', () => {
    const result = cn('base', null, 'after')
    expect(result).toBe('base after')
  })

  it('should handle array of classes', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })

  it('should handle object notation', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6')
    expect(result).toBe('py-2 px-6')
  })

  it('should handle conflicting Tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle empty string', () => {
    const result = cn('')
    expect(result).toBe('')
  })

  it('should handle complex Tailwind merging', () => {
    const result = cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')
    expect(result).toBe('hover:bg-red-600 bg-blue-500')
  })

  it('should handle responsive classes', () => {
    const result = cn('md:px-4', 'md:px-8')
    expect(result).toBe('md:px-8')
  })

  it('should preserve non-conflicting classes', () => {
    const result = cn('rounded-lg shadow-md', 'hover:shadow-lg')
    expect(result).toBe('rounded-lg shadow-md hover:shadow-lg')
  })

  it('should work with mixed input types', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true, 'ignored-class': false },
      undefined,
      'final'
    )
    expect(result).toBe('base array-class object-class final')
  })
})
