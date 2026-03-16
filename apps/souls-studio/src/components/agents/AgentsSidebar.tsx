import { useVirtualizer } from '@tanstack/react-virtual'
import { RefreshCw, Zap } from 'lucide-react'
import { useRef } from 'react'
import { useGateway } from '../../contexts/GatewayContext'
import type { GatewayAgent } from '../../types/soul'

interface AgentsSidebarProps {
  agents: GatewayAgent[]
  selectedAgentId: string | null
  onSelect: (id: string) => void
}

export function AgentsSidebar({ agents, selectedAgentId, onSelect }: AgentsSidebarProps) {
  const { refreshAgents } = useGateway()
  const listRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: agents.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 60,
    overscan: 5,
  })

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border)] sidebar-source-list">
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          Agents ({agents.length})
        </p>
        <button
          onClick={refreshAgents}
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors btn-press"
          aria-label="Refresh agent list"
        >
          <RefreshCw className="w-3 h-3 text-[var(--text-muted)]" />
        </button>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-1.5"
        role="listbox"
        aria-label="Agents list"
      >
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const agent = agents[virtualItem.index]
            const isSelected = agent.agentId === selectedAgentId
            return (
              <button
                key={agent.agentId}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(agent.agentId)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'border border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border border-transparent hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: 'var(--accent)' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-mono text-[var(--text-primary)] truncate flex-1">
                    {agent.agentId}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 ml-[22px]">
                  {agent.hasSoulMd && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">
                      SOUL
                    </span>
                  )}
                  {agent.hasToolsMd && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">
                      TOOLS
                    </span>
                  )}
                  {agent.hasAgentsMd && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium">
                      AGENTS
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
