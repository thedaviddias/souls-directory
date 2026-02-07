import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type WizardStep, useWizardNavigation } from '../use-wizard-navigation'

const defaultReadiness = {
  source: true,
  review: true,
  metadata: true,
  publish: true,
}

function TestWrapper({
  readiness,
  initialStep,
}: {
  readiness: typeof defaultReadiness
  initialStep?: WizardStep
}) {
  const { currentStep, canProceed, goNext, goBack, goToStep, setStep, steps } = useWizardNavigation(
    readiness,
    initialStep
  )
  return (
    <div>
      <span data-testid="current-step">{currentStep}</span>
      <span data-testid="can-proceed">{String(canProceed)}</span>
      <button type="button" onClick={goNext}>
        Next
      </button>
      <button type="button" onClick={goBack}>
        Back
      </button>
      {steps.map((s) => (
        <button key={s.id} type="button" onClick={() => goToStep(s.id)}>
          Go to {s.id}
        </button>
      ))}
      {steps.map((s) => (
        <button key={`set-${s.id}`} type="button" onClick={() => setStep(s.id)}>
          Set {s.id}
        </button>
      ))}
    </div>
  )
}

describe('useWizardNavigation', () => {
  it('starts at source by default', () => {
    render(<TestWrapper readiness={defaultReadiness} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')
  })

  it('starts at initialStep when provided', () => {
    render(<TestWrapper readiness={defaultReadiness} initialStep="metadata" />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
  })

  it('canProceed reflects readiness for current step', () => {
    const { rerender } = render(<TestWrapper readiness={{ ...defaultReadiness, source: false }} />)
    expect(screen.getByTestId('can-proceed')).toHaveTextContent('false')

    rerender(<TestWrapper readiness={{ ...defaultReadiness, source: true }} />)
    expect(screen.getByTestId('can-proceed')).toHaveTextContent('true')
  })

  it('goNext advances when canProceed is true', () => {
    render(<TestWrapper readiness={defaultReadiness} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')

    act(() => {
      screen.getByText('Next').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('review')

    act(() => {
      screen.getByText('Next').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')

    act(() => {
      screen.getByText('Next').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('publish')

    act(() => {
      screen.getByText('Next').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('publish')
  })

  it('goNext does not advance when canProceed is false', () => {
    render(<TestWrapper readiness={{ ...defaultReadiness, source: false }} />)
    act(() => {
      screen.getByText('Next').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')
  })

  it('goBack always moves to previous step', () => {
    render(<TestWrapper readiness={defaultReadiness} initialStep="publish" />)
    act(() => {
      screen.getByText('Back').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
    act(() => {
      screen.getByText('Back').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('review')
  })

  it('goBack does nothing on first step', () => {
    render(<TestWrapper readiness={defaultReadiness} />)
    act(() => {
      screen.getByText('Back').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')
  })

  it('goToStep allows going back freely', () => {
    render(<TestWrapper readiness={defaultReadiness} initialStep="publish" />)
    act(() => {
      screen.getByText('Go to source').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')
  })

  it('goToStep allows going forward only when canProceed', () => {
    render(<TestWrapper readiness={{ ...defaultReadiness, source: false }} />)
    act(() => {
      screen.getByText('Go to publish').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')
  })

  it('setStep jumps to any step regardless of readiness', () => {
    render(<TestWrapper readiness={{ ...defaultReadiness, source: false }} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('source')

    // goToStep would block this because source readiness is false
    act(() => {
      screen.getByText('Set metadata').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
  })

  it('setStep allows jumping backward', () => {
    render(<TestWrapper readiness={defaultReadiness} initialStep="publish" />)
    act(() => {
      screen.getByText('Set review').click()
    })
    expect(screen.getByTestId('current-step')).toHaveTextContent('review')
  })

  describe('edit mode flows', () => {
    it('edit mode: starts on metadata with initialStep and canProceed reflects metadata readiness', () => {
      const editModeReadiness = {
        source: false,
        review: true,
        metadata: true,
        publish: true,
      }
      render(<TestWrapper readiness={editModeReadiness} initialStep="metadata" />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
      expect(screen.getByTestId('can-proceed')).toHaveTextContent('true')
    })

    it('edit mode: goToStep back to source from metadata', () => {
      render(<TestWrapper readiness={defaultReadiness} initialStep="metadata" />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')

      act(() => {
        screen.getByText('Go to source').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('source')
    })

    it('edit mode: stuck on source when readiness is false', () => {
      const readinessSourceNotReady = {
        source: false,
        review: true,
        metadata: true,
        publish: true,
      }
      render(<TestWrapper readiness={readinessSourceNotReady} initialStep="metadata" />)
      act(() => {
        screen.getByText('Go to source').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('source')
      expect(screen.getByTestId('can-proceed')).toHaveTextContent('false')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('source')
    })

    it('edit mode: source readiness true allows proceeding from source', () => {
      render(<TestWrapper readiness={defaultReadiness} />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('source')
      expect(screen.getByTestId('can-proceed')).toHaveTextContent('true')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')
    })

    it('goToStep forward from source to metadata when intermediate steps ready', () => {
      render(<TestWrapper readiness={defaultReadiness} />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('source')

      act(() => {
        screen.getByText('Go to metadata').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
    })
  })

  describe('fork mode flows', () => {
    it('fork mode: starts on review with initialStep', () => {
      render(<TestWrapper readiness={defaultReadiness} initialStep="review" />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')
    })

    it('fork mode: canProceed reflects review readiness', () => {
      const forkReadiness = {
        source: true,
        review: true,
        metadata: true,
        publish: true,
      }
      render(<TestWrapper readiness={forkReadiness} initialStep="review" />)
      expect(screen.getByTestId('can-proceed')).toHaveTextContent('true')
    })

    it('fork mode: can proceed from review to metadata', () => {
      render(<TestWrapper readiness={defaultReadiness} initialStep="review" />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')
    })

    it('fork mode: can navigate back from metadata to review', () => {
      render(<TestWrapper readiness={defaultReadiness} initialStep="review" />)

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')

      act(() => {
        screen.getByText('Back').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')
    })

    it('fork mode: blocked on review when review readiness is false', () => {
      const forkReadiness = {
        source: true,
        review: false,
        metadata: true,
        publish: true,
      }
      render(<TestWrapper readiness={forkReadiness} initialStep="review" />)
      expect(screen.getByTestId('can-proceed')).toHaveTextContent('false')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')
    })

    it('fork mode: full flow review → metadata → publish', () => {
      render(<TestWrapper readiness={defaultReadiness} initialStep="review" />)
      expect(screen.getByTestId('current-step')).toHaveTextContent('review')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('metadata')

      act(() => {
        screen.getByText('Next').click()
      })
      expect(screen.getByTestId('current-step')).toHaveTextContent('publish')
    })
  })
})
