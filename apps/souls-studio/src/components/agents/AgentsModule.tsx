import { GripVertical, Settings, WifiOff, Zap } from 'lucide-react'
import { useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useGateway } from '../../contexts/GatewayContext'
import { AgentDetail } from './AgentDetail'
import { AgentsSidebar } from './AgentsSidebar'

function openConnectionSettings() {
  window.dispatchEvent(new CustomEvent('souls-studio:open-settings', { detail: 'connections' }))
}

export function AgentsModule() {
  const { status, agents } = useGateway()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId) ?? null

  // Auto-select first agent when list changes
  if (agents.length > 0 && !selectedAgent) {
    const first = agents[0].agentId
    if (first !== selectedAgentId) {
      setSelectedAgentId(first)
    }
  }

  if (status !== 'connected') {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-xs animate-fade-in-up">
          <div className="empty-state-icon">
            <WifiOff />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Not connected to a gateway
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
            Connect to an OpenClaw gateway to see and manage your agents in real time.
          </p>
          <button
            onClick={openConnectionSettings}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors btn-press"
          >
            <Settings className="w-4 h-4" />
            Configure Connection
          </button>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-xs animate-fade-in-up">
          <div className="empty-state-icon">
            <Zap />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">No agents registered</p>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
            Start an agent on this gateway and it will appear here automatically. Agents register
            themselves when they connect.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <AgentsSidebar
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
      </Panel>
      <Separator className="w-1.5 bg-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-col-resize flex items-center justify-center group">
        <GripVertical
          className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </Separator>
      <Panel defaultSize={75} minSize={40}>
        <AgentDetail agent={selectedAgent} />
      </Panel>
    </Group>
  )
}
