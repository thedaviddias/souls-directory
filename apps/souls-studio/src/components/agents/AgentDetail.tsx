import { AlertCircle, Loader2, RefreshCw, RotateCcw, Save, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAgentFiles } from '../../hooks/useAgentFiles'
import { useSettings } from '../../hooks/useSettings'
import type { AgentFileType, GatewayAgent } from '../../types/soul'

interface AgentDetailProps {
  agent: GatewayAgent | null
}

const FILE_TABS: { key: AgentFileType; label: string; flag: keyof GatewayAgent }[] = [
  { key: 'soul.md', label: 'SOUL.md', flag: 'hasSoulMd' },
  { key: 'tools.md', label: 'TOOLS.md', flag: 'hasToolsMd' },
]

export function AgentDetail({ agent }: AgentDetailProps) {
  const { settings } = useSettings()
  const { files, drafts, deploying, fetchFile, updateDraft, deployFile, isDirty, revert } =
    useAgentFiles(agent?.agentId ?? null)
  const [activeFile, setActiveFile] = useState<AgentFileType>('soul.md')

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-secondary)]">
        <p className="text-sm text-[var(--text-muted)]">Select an agent to view its files</p>
      </div>
    )
  }

  const availableTabs = FILE_TABS.filter((t) => agent[t.flag])
  const fileState = files[activeFile]
  const draft = drafts[activeFile] ?? ''
  const dirty = isDirty(activeFile)
  const isDeploying = deploying === activeFile

  const handleDeploy = async () => {
    const result = await deployFile(activeFile, draft)
    if (result.success) {
      toast.success(`${activeFile} deployed to ${agent.agentId}`)
    } else {
      toast.error(result.error ?? 'Deploy failed')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-medium text-[var(--text-primary)] truncate font-mono">
            {agent.agentId}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button
              onClick={() => revert(activeFile)}
              disabled={isDeploying}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Revert
            </button>
          )}
          <button
            onClick={() => void handleDeploy()}
            disabled={isDeploying || !fileState?.content}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Save & Deploy
              </>
            )}
          </button>
        </div>
      </div>

      {/* File tabs */}
      {availableTabs.length > 1 && (
        <div className="px-4 pt-2 flex items-center gap-1 border-b border-[var(--border)]">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFile(tab.key)
                if (!files[tab.key]) fetchFile(tab.key)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                activeFile === tab.key
                  ? 'border-[var(--accent)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
              {isDirty(tab.key) && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {fileState?.loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2
                className="w-6 h-6 mx-auto mb-2 animate-spin"
                style={{ color: 'var(--accent)' }}
              />
              <p className="text-xs text-[var(--text-muted)]">Loading {activeFile}...</p>
            </div>
          </div>
        ) : fileState?.error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-[320px]">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                Could not load file
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">{fileState.error}</p>
              <button
                onClick={() => fetchFile(activeFile)}
                className="flex items-center gap-1.5 mx-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </div>
        ) : (
          <textarea
            value={draft}
            onChange={(e) => updateDraft(activeFile, e.target.value)}
            className="w-full h-full p-4 bg-transparent text-[var(--text-primary)] font-mono resize-none outline-none"
            style={{ fontSize: settings.editorFontSize }}
            spellCheck={false}
            placeholder={`No content in ${activeFile}. Start typing to create it.`}
          />
        )}
      </div>
    </div>
  )
}
