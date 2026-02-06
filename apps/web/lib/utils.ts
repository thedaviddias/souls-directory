import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 * Standard shadcn/ui utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
