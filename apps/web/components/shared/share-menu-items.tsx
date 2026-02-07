'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { logger } from '@/lib/logger'
import { Check, Link2, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareMenuItemsProps {
  title: string
  text: string
  shareUrl: string
}

export function ShareMenuItems({ title, text, shareUrl }: ShareMenuItemsProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      toast.success('Link copied')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      logger.error('Failed to copy link', error, { shareUrl })
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        })
        toast.success('Shared')
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('Share failed', err, { shareUrl })
          toast.error('Share failed')
        }
      }
    } else {
      await handleCopyLink()
    }
  }

  const tweetText = `${title} – ${text}`

  return (
    <>
      <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
        {copiedLink ? (
          <Check className="w-4 h-4 text-emerald-500" aria-hidden />
        ) : (
          <Link2 className="w-4 h-4" aria-hidden />
        )}
        <span>{copiedLink ? 'Link copied' : 'Copy link'}</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer">
        <Share2 className="w-4 h-4" aria-hidden />
        <span>Share via…</span>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a
          href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Post on X</span>
        </a>
      </DropdownMenuItem>
    </>
  )
}
