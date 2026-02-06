'use client'

import confetti from 'canvas-confetti'
import { Check } from 'lucide-react'
import { useCallback, useState } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  onCopy?: () => void
  showTip?: boolean
}

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
  onCopy,
  showTip = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    onCopy?.()

    // Mini confetti burst - grayscale colors
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#ededed', '#878787', '#525252'],
      disableForReducedMotion: true,
    })

    // Show contextual tip after 500ms
    if (showTip) {
      setTimeout(() => setShowHint(true), 500)
    }

    // Reset after 3s
    setTimeout(() => {
      setCopied(false)
      setShowHint(false)
    }, 3000)
  }, [text, onCopy, showTip])

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleCopy}
        data-copy-button
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md
          font-medium text-sm transition-all duration-200
          ${
            copied
              ? 'bg-text text-bg'
              : 'border border-border text-text-secondary hover:border-text-muted hover:text-text'
          }
          ${className}
        `}
      >
        {copied ? (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {label}
          </>
        )}
      </button>

      {/* Contextual tip tooltip */}
      {showHint && (
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-50
                     bg-text text-bg
                     px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap
                     shadow-lg animate-fade-in"
        >
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            Copied!
          </span>
          <span className="block text-xs opacity-80">Paste into your SOUL.md</span>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-text rotate-45" />
        </div>
      )}
    </div>
  )
}
