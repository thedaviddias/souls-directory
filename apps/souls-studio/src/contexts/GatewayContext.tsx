import { type ReactNode, createContext, useContext } from 'react'
import { useGatewayConnection } from '../hooks/useGatewayConnection'
import { useGatewayDiscovery } from '../hooks/useGatewayDiscovery'
import type { DiscoveredGateway, ScanReport } from '../hooks/useGatewayDiscovery'
import { useSettings } from '../hooks/useSettings'
import type { GatewayAgent, GatewayConnectionStatus, OpenClawConnection } from '../types/soul'

interface GatewayContextValue {
  // Connection state
  activeConnectionId: string | null
  activeConnection: OpenClawConnection | null
  status: GatewayConnectionStatus
  agents: GatewayAgent[]
  error: string | null
  reconnecting: boolean
  retryCount: number
  maxRetries: number
  nextRetryIn: number | null
  connect: (id: string) => Promise<void>
  disconnect: () => Promise<void>
  switchConnection: (id: string) => Promise<void>
  refreshAgents: () => void
  stopRetrying: () => void
  retry: () => void

  // Messaging
  sendMessage: (msg: object) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: (handler: (msg: any) => void) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsubscribe: (handler: (msg: any) => void) => void

  // Discovery
  discovered: DiscoveredGateway[]
  scanning: boolean
  scanReport: ScanReport | null
  rescan: () => Promise<void>
  dismissDiscovered: (id: string) => void

  // Settings shortcuts
  connections: OpenClawConnection[]
  addConnection: (c: OpenClawConnection) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  updateConnection: (id: string, patch: Partial<OpenClawConnection>) => Promise<void>
}

const GatewayCtx = createContext<GatewayContextValue | null>(null)

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { settings, addConnection, removeConnection, updateConnection } = useSettings()
  const connections = settings.openclawConnections

  const gateway = useGatewayConnection(connections)
  const discovery = useGatewayDiscovery(connections)

  const value: GatewayContextValue = {
    ...gateway,
    discovered: discovery.discovered,
    scanning: discovery.scanning,
    scanReport: discovery.scanReport,
    rescan: discovery.scan,
    dismissDiscovered: discovery.dismiss,
    connections,
    addConnection,
    removeConnection,
    updateConnection,
  }

  return <GatewayCtx.Provider value={value}>{children}</GatewayCtx.Provider>
}

export function useGateway() {
  const ctx = useContext(GatewayCtx)
  if (!ctx) throw new Error('useGateway must be used within GatewayProvider')
  return ctx
}
