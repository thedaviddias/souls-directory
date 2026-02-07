'use client'

import { ShareMenuItems } from '@/components/shared/share-menu-items'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2 } from 'lucide-react'

interface GuideShareButtonProps {
  title: string
  description: string
  shareUrl: string
  className?: string
}

export function GuideShareButton({
  title,
  description,
  shareUrl,
  className = '',
}: GuideShareButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors ${className}`}
          aria-label="Share article"
          title="Share"
        >
          <Share2 className="w-4 h-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
        <ShareMenuItems title={title} text={description} shareUrl={shareUrl} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
