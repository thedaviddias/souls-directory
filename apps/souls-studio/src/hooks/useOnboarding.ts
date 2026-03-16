import { useCallback, useEffect, useState } from 'react'
import { invoke, isTauriRuntime } from '../lib/tauri'

const STORAGE_KEY = 'souls-studio-onboarding-completed'

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean | null>(null)

  useEffect(() => {
    if (isTauriRuntime()) {
      invoke<boolean>('get_onboarding_completed')
        .then((v) => setCompleted(v ?? false))
        .catch(() => {
          // Fallback to localStorage if Tauri command doesn't exist yet
          setCompleted(localStorage.getItem(STORAGE_KEY) === 'true')
        })
    } else {
      setCompleted(localStorage.getItem(STORAGE_KEY) === 'true')
    }
  }, [])

  const markCompleted = useCallback(() => {
    setCompleted(true)
    if (isTauriRuntime()) {
      invoke('set_onboarding_completed', { completed: true }).catch(() => {
        // Fallback
        localStorage.setItem(STORAGE_KEY, 'true')
      })
    } else {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }, [])

  return { completed, markCompleted }
}
