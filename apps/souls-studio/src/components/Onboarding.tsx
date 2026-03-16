import { ArrowLeft, ArrowRight, Check, Github, Globe, PenTool, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { trackEvent } from '../lib/analytics'

interface OnboardingStep {
  title: string
  description: string
  image: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Souls Studio',
    description:
      'Your desktop companion for creating, editing, and publishing AI souls. Everything works locally first — no account required.',
    image: '/images/onboarding-welcome.png',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    title: 'Explore Community Souls',
    description:
      'Browse hundreds of community-created souls. Find inspiration, fork what you like, and make it your own.',
    image: '/images/onboarding-explore.png',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    title: 'Create & Edit Locally',
    description:
      'Write SOUL.md files with a live preview editor. Your work is saved locally on your machine — always available, even offline.',
    image: '/images/onboarding-edit.png',
    icon: <PenTool className="w-5 h-5" />,
  },
  {
    title: 'Sync with souls.directory',
    description:
      'Optionally sign in with GitHub to publish your souls to souls.directory and keep everything in sync across devices.',
    image: '/images/onboarding-sync.png',
    icon: <Github className="w-5 h-5" />,
  },
]

interface OnboardingProps {
  onComplete: () => void
  onSignIn?: () => void
}

export function Onboarding({ onComplete, onSignIn }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const isLastStep = currentStep === steps.length - 1
  const step = steps[currentStep]

  const handleNext = () => {
    if (isLastStep) {
      trackEvent('onboarding_completed')
      onComplete()
    } else {
      setCurrentStep((s) => s + 1)
      trackEvent('onboarding_step_viewed', { step: currentStep + 1 })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleSkip = () => {
    trackEvent('onboarding_skipped', { at_step: currentStep })
    onComplete()
  }

  const handleSignIn = () => {
    trackEvent('onboarding_sign_in')
    onSignIn?.()
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-2xl mx-auto px-6 animate-fade-in">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-[var(--accent)]'
                  : i < currentStep
                    ? 'w-4 bg-[var(--accent)]/40'
                    : 'w-4 bg-[var(--border)]'
              }`}
            />
          ))}
        </div>

        {/* Image placeholder */}
        <div
          className="relative w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden mb-8"
          style={{ aspectRatio: '16 / 10' }}
        >
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image, show placeholder
              const target = e.currentTarget
              target.style.display = 'none'
              const sibling = target.nextElementSibling
              if (sibling instanceof HTMLElement) sibling.style.display = 'flex'
            }}
          />
          <div
            className="absolute inset-0 items-center justify-center flex-col gap-3 text-[var(--text-muted)]"
            style={{ display: 'none' }}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--accent)] [&>svg]:w-7 [&>svg]:h-7">
              {step.icon}
            </div>
            <p className="text-sm">Screenshot placeholder</p>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              {step.icon}
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{step.title}</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Sign-in CTA on last step */}
        {isLastStep && onSignIn && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              <Github className="w-4 h-4" />
              Sign in with GitHub
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
          >
            {isLastStep ? (
              <>
                Get Started
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
