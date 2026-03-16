import { ArrowUpCircle, Download, Loader2, RotateCcw, X } from 'lucide-react'

interface UpdateBannerProps {
  version: string
  downloading: boolean
  downloadProgress: number
  onUpdate: () => void
  onWhatsNew: () => void
  onDismiss: () => void
}

export function UpdateBanner({
  version,
  downloading,
  downloadProgress,
  onUpdate,
  onWhatsNew,
  onDismiss,
}: UpdateBannerProps) {
  if (downloading) {
    return (
      <div className="h-9 bg-[var(--accent)] text-white px-4 flex items-center justify-center gap-3 text-xs font-medium shrink-0">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Downloading update... {downloadProgress}%</span>
        <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      </div>
    )
  }

  if (downloadProgress === 100) {
    return (
      <div className="h-9 bg-[var(--accent)] text-white px-4 flex items-center justify-center gap-3 text-xs font-medium shrink-0">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Update installed — restart to finish</span>
        <button
          onClick={onUpdate}
          className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
        >
          Restart Now
        </button>
      </div>
    )
  }

  return (
    <div className="h-9 bg-[var(--accent)] text-white px-4 flex items-center justify-center gap-3 text-xs font-medium shrink-0">
      <ArrowUpCircle className="w-3.5 h-3.5" />
      <span>Update available: v{version}</span>
      <button onClick={onWhatsNew} className="underline underline-offset-2 hover:no-underline">
        What's new
      </button>
      <button
        onClick={onUpdate}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
      >
        <Download className="w-3 h-3" />
        Update Now
      </button>
      <button
        onClick={onDismiss}
        className="ml-auto p-0.5 hover:bg-white/20 rounded transition-colors"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
