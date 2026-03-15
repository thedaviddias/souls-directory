'use client'

import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAnalytics } from '@/hooks/use-analytics'
import { Check, Copy, ExternalLink, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'

const SKILL_COMMAND = 'npx skills add https://github.com/thedaviddias/souls-directory'
const REPO_URL = 'https://github.com/thedaviddias/souls-directory'

interface SkillCommandCardProps {
  triggerLabel?: string
  dialogTitle?: string
  dialogDescription?: string
  analyticsLocation?: 'hero' | 'builder'
  triggerVariant?: ButtonProps['variant']
  triggerSize?: ButtonProps['size']
  triggerClassName?: string
  showTriggerIcon?: boolean
}

export function SkillCommandCard({
  triggerLabel = 'Install skill',
  dialogTitle = 'Install SOUL.md Creator',
  dialogDescription = 'Install SOUL.md Creator to write a soul from scratch, then tailor it to your workflow.',
  analyticsLocation = 'hero',
  triggerVariant = 'secondary',
  triggerSize = 'default',
  triggerClassName,
  showTriggerIcon = true,
}: SkillCommandCardProps) {
  const analytics = useAnalytics()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(SKILL_COMMAND)
    analytics.track('homepage_skill_command_copy', { location: analyticsLocation })
    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 2000)
  }, [analytics, analyticsLocation])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          onClick={() =>
            analytics.track('homepage_skill_cta_click', { location: analyticsLocation })
          }
          className={triggerClassName}
        >
          {showTriggerIcon ? <Sparkles className="h-4 w-4" /> : null}
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="border-border bg-surface p-6 sm:max-w-2xl sm:rounded-xl"
        onOpenAutoFocus={() =>
          analytics.track('homepage_skill_modal_open', { location: analyticsLocation })
        }
      >
        <DialogHeader>
          <DialogTitle className="text-left text-text text-base font-medium">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-text-secondary">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="min-w-0 rounded-xl border border-border bg-elevated p-4">
            <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.24em] text-text-muted">
              Install command
            </p>

            <div className="space-y-3">
              <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-surface px-4 py-3">
                <code className="block whitespace-nowrap text-sm font-mono text-text-secondary">
                  $ {SKILL_COMMAND}
                </code>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy SOUL.md Creator install command"
                className="w-full sm:w-auto"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy command'}
              </Button>
            </div>

            <p aria-live="polite" className="mt-3 min-h-4 text-xs text-text-muted">
              {copied
                ? 'Copied to clipboard.'
                : 'Run this command to install the skill from the repo.'}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            Best for people who want to create a SOUL.md from scratch instead of starting with a
            template from the directory.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text"
          >
            View source
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { REPO_URL as SOUL_MD_CREATOR_REPO_URL, SKILL_COMMAND as SOUL_MD_CREATOR_COMMAND }
