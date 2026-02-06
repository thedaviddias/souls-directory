'use client'

import { useCallback, useMemo, useState } from 'react'

type WizardStep = 'source' | 'review' | 'metadata' | 'publish'

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'source', label: 'Source' },
  { id: 'review', label: 'Review' },
  { id: 'metadata', label: 'Details' },
  { id: 'publish', label: 'Publish' },
]

interface StepReadiness {
  source: boolean
  review: boolean
  metadata: boolean
  publish: boolean
}

interface UseWizardNavigationReturn {
  /** Current active step */
  currentStep: WizardStep
  /** Step definitions with id and label */
  steps: typeof STEPS
  /** Whether the current step allows proceeding forward */
  canProceed: boolean
  /** Navigate to a specific step (respects forward validation) */
  goToStep: (step: WizardStep) => void
  /** Programmatically set step without validation (for edit mode init, etc.) */
  setStep: (step: WizardStep) => void
  /** Go to the next step */
  goNext: () => void
  /** Go to the previous step */
  goBack: () => void
}

/**
 * Manages wizard step navigation with forward validation.
 * Going back is always allowed; going forward requires the current step to be ready.
 */
export function useWizardNavigation(
  readiness: StepReadiness,
  initialStep?: WizardStep
): UseWizardNavigationReturn {
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep ?? 'source')

  const canProceed = useMemo(() => {
    return readiness[currentStep]
  }, [currentStep, readiness])

  const goToStep = useCallback(
    (step: WizardStep) => {
      const stepIndex = STEPS.findIndex((s) => s.id === step)
      const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

      // Allow going back freely
      if (stepIndex < currentIndex) {
        setCurrentStep(step)
        return
      }

      // Forward requires readiness
      if (canProceed) {
        setCurrentStep(step)
      }
    },
    [currentStep, canProceed]
  )

  const goNext = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (currentIndex < STEPS.length - 1 && canProceed) {
      setCurrentStep(STEPS[currentIndex + 1].id)
    }
  }, [currentStep, canProceed])

  const goBack = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
    }
  }, [currentStep])

  return {
    currentStep,
    steps: STEPS,
    canProceed,
    goToStep,
    setStep: setCurrentStep,
    goNext,
    goBack,
  }
}

export type { WizardStep }
