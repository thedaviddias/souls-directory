import { useEffect, useState } from 'react'

const EMPTY_SET = new Set<string>()

export function useInstalledSoulSlugs(): Set<string> {
  const [slugs, setSlugs] = useState<Set<string>>(EMPTY_SET)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string[]>).detail
      if (Array.isArray(detail)) {
        setSlugs(new Set(detail))
      }
    }

    window.addEventListener('souls-studio:store-updated', handler)
    return () => window.removeEventListener('souls-studio:store-updated', handler)
  }, [])

  return slugs
}
