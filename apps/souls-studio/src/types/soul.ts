export interface Soul {
  id: string
  name: string
  description: string
  owner: string
  repo: string
  soulsPath: string
  path: string
  content?: string
  isInstalled: boolean
  isFetched: boolean
}

export interface SoulRepository {
  owner: string
  repo: string
  soulsPath: string
  lastFetched?: string
}

export interface Catalog {
  version: string
  lastUpdated: string
  souls: CatalogSoul[]
}

export interface CatalogSoul {
  id: string
  name: string
  description: string
  owner: string
  repo: string
  soulsPath: string
  path: string
}

export interface FetchedRepos {
  repos: Record<string, string>
}

export type InstallMethod = 'npx' | 'copy'
export type ThemeMode = 'system' | 'light' | 'dark'

export type OpenClawConnectionMethod = 'local' | 'ssh' | 'tailscale' | 'direct'

export interface OpenClawConnection {
  id: string
  name: string
  method: OpenClawConnectionMethod
  gatewayUrl: string
  authToken?: string
  sshHost?: string
  sshUser?: string
  sshPort?: number
  sshKeyPath?: string
  sshPassphrase?: string
  sshPassword?: string
  isDefault?: boolean
  discovered?: boolean
}

export interface GatewayAgent {
  agentId: string
  hasSoulMd: boolean
  hasAgentsMd: boolean
  hasToolsMd: boolean
}

export type GatewayConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export type AgentFileType = 'soul.md' | 'tools.md' | 'agents.md'

export interface SshHostCandidate {
  hostAlias: string
  hostname: string
  user?: string
  port: number
  identityFile?: string
  gatewayResponds: boolean
}

export interface Settings {
  installMethod: InstallMethod
  theme: ThemeMode
  editorFontSize: number
  syncIntervalSeconds: number
  openclawConnections: OpenClawConnection[]
}

export interface RepoGroup {
  owner: string
  repo: string
  souls: Soul[]
  isFetched: boolean
  isCustom?: boolean
}

export interface RepoInfo {
  owner: string
  repo: string
  isFetched: boolean
  isCustom: boolean
  highlight: boolean
}

export type Selection =
  | { type: 'none' }
  | { type: 'repo'; repo: RepoGroup }
  | { type: 'soul'; soul: Soul }

export interface Favorites {
  souls: string[]
  repos: string[]
}

export interface SoulSnapshot {
  name: string
  slug: string
  tagline: string
  description: string
  content: string
  updatedAt: number
}

export type LocalSoulSyncState = 'synced' | 'pending' | 'error'

export interface LocalSoul {
  localId: string
  remoteId?: string
  ownerHandle?: string
  slug: string
  name: string
  tagline: string
  description: string
  content: string
  localUpdatedAt: number
  remoteUpdatedAt?: number
  syncState: LocalSoulSyncState
  snapshot?: SoulSnapshot
  deleted?: boolean
  lastError?: string
}

export type SyncOperationType = 'publish' | 'updateMetadata' | 'deleteSoul'

export interface SyncOperation {
  id: string
  localSoulId: string
  type: SyncOperationType
  createdAt: number
  retryCount: number
  lastError?: string
}

export interface SoulsStoreMeta {
  schemaVersion: number
  lastPullAt?: number
  lastPushAt?: number
}

export interface SoulsStore {
  records: LocalSoul[]
  ops: SyncOperation[]
  meta: SoulsStoreMeta
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

export interface SyncStatus {
  state: SyncState
  pendingCount: number
  lastSyncAt?: number
  cappedByLimit: boolean
  lastError?: string
}

export const DEFAULT_SOULS_STORE: SoulsStore = {
  records: [],
  ops: [],
  meta: {
    schemaVersion: 1,
  },
}
