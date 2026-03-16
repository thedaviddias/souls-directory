import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpenClawConnection } from '../types/soul'
import { useGatewayConnection } from './useGatewayConnection'

// ── Mocks ───────────────────────────────────────────────────────

// Mock the tauri module
vi.mock('../lib/tauri', () => ({
  invoke: vi.fn(),
  isTauriRuntime: vi.fn(() => true),
}))

import { invoke, isTauriRuntime } from '../lib/tauri'
const mockInvoke = vi.mocked(invoke)
const mockIsTauriRuntime = vi.mocked(isTauriRuntime)

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = []
  url: string
  readyState = 0 // CONNECTING
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = 3 // CLOSED
  }

  // Test helpers
  simulateOpen() {
    this.readyState = 1 // OPEN
    this.onopen?.()
  }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  simulateError() {
    this.onerror?.()
  }

  simulateClose() {
    this.readyState = 3
    this.onclose?.()
  }

  static OPEN = 1
  static CLOSED = 3
  static CONNECTING = 0
}

// ── Helpers ─────────────────────────────────────────────────────

function makeConnection(overrides: Partial<OpenClawConnection> = {}): OpenClawConnection {
  return {
    id: 'test-conn-1',
    name: 'Test Connection',
    method: 'local',
    gatewayUrl: 'ws://127.0.0.1:18789',
    ...overrides,
  }
}

function makeSshConnection(overrides: Partial<OpenClawConnection> = {}): OpenClawConnection {
  return {
    id: 'ssh-conn-1',
    name: 'SSH Connection',
    method: 'ssh',
    gatewayUrl: 'ws://127.0.0.1:18789',
    sshHost: '10.20.40.39',
    sshUser: 'root',
    sshPort: 22,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('useGatewayConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    mockIsTauriRuntime.mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('starts disconnected with no agents', () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      expect(result.current.status).toBe('disconnected')
      expect(result.current.agents).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.activeConnectionId).toBeNull()
    })
  })

  describe('local/direct connection', () => {
    it('connects via WebSocket to gateway URL', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      expect(MockWebSocket.instances).toHaveLength(1)
      expect(MockWebSocket.instances[0].url).toBe('ws://127.0.0.1:18789')
      expect(result.current.status).toBe('connecting')
    })

    it('sets connected status on WebSocket open', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(result.current.status).toBe('connected')
      expect(result.current.error).toBeNull()
    })

    it('requests agent list on connect', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      const sent = MockWebSocket.instances[0].sentMessages
      expect(sent.some((m) => JSON.parse(m).type === 'list_agents')).toBe(true)
    })

    it('parses agents_list messages', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({
          type: 'agents_list',
          agents: [{ agentId: 'agent-1', hasSoulMd: true, hasAgentsMd: false, hasToolsMd: false }],
        })
      })

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].agentId).toBe('agent-1')
    })

    it('sets error on WebSocket error', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateError()
      })

      expect(result.current.error).toBe('Connection error')
    })
  })

  describe('SSH connection', () => {
    it('invokes start_ssh_tunnel with correct params', async () => {
      mockInvoke.mockResolvedValueOnce({ pid: 1234, localPort: 55000 })
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(mockInvoke).toHaveBeenCalledWith('start_ssh_tunnel', {
        sshHost: '10.20.40.39',
        sshUser: 'root',
        sshPort: 22,
        sshKeyPath: null,
        sshPassphrase: null,
        sshPassword: null,
        remotePort: 18789,
      })
    })

    it('connects WebSocket to local tunnel port after SSH succeeds', async () => {
      mockInvoke.mockResolvedValueOnce({ pid: 1234, localPort: 55000 })
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(MockWebSocket.instances).toHaveLength(1)
      expect(MockWebSocket.instances[0].url).toBe('ws://127.0.0.1:55000')
    })

    it('passes SSH password when provided', async () => {
      mockInvoke.mockResolvedValueOnce({ pid: 1234, localPort: 55000 })
      const conn = makeSshConnection({ sshPassword: 'my_password' })
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(mockInvoke).toHaveBeenCalledWith(
        'start_ssh_tunnel',
        expect.objectContaining({
          sshPassword: 'my_password',
        })
      )
    })

    it('passes SSH key path and passphrase when provided', async () => {
      mockInvoke.mockResolvedValueOnce({ pid: 1234, localPort: 55000 })
      const conn = makeSshConnection({
        sshKeyPath: '~/.ssh/id_rsa',
        sshPassphrase: 'key_passphrase',
      })
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(mockInvoke).toHaveBeenCalledWith(
        'start_ssh_tunnel',
        expect.objectContaining({
          sshKeyPath: '~/.ssh/id_rsa',
          sshPassphrase: 'key_passphrase',
        })
      )
    })

    it('shows SSH error when tunnel fails', async () => {
      mockInvoke.mockRejectedValueOnce('SSH tunnel failed: Permission denied (publickey,password).')
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toContain('SSH tunnel failed')
      expect(result.current.error).toContain('Permission denied')
    })

    it('shows timeout error when tunnel times out', async () => {
      mockInvoke.mockRejectedValueOnce('SSH tunnel timed out — the remote host may be unreachable')
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toContain('timed out')
    })

    it('stores SSH PID for cleanup', async () => {
      mockInvoke.mockResolvedValueOnce({ pid: 9999, localPort: 55000 })
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      // Disconnect should invoke stop_ssh_tunnel with the PID
      mockInvoke.mockResolvedValueOnce(undefined)
      await act(async () => {
        await result.current.disconnect()
      })

      expect(mockInvoke).toHaveBeenCalledWith('stop_ssh_tunnel', { pid: 9999 })
    })

    it('falls back to direct WebSocket when not Tauri runtime', async () => {
      mockIsTauriRuntime.mockReturnValue(false)
      const conn = makeSshConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('ssh-conn-1')
      })

      // Should NOT invoke start_ssh_tunnel
      expect(mockInvoke).not.toHaveBeenCalled()
      // Should fall through to direct WebSocket connect using gatewayUrl
      expect(MockWebSocket.instances).toHaveLength(1)
      expect(MockWebSocket.instances[0].url).toBe('ws://127.0.0.1:18789')
    })
  })

  describe('disconnect', () => {
    it('resets state on disconnect', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      expect(result.current.status).toBe('connected')

      await act(async () => {
        await result.current.disconnect()
      })

      expect(result.current.status).toBe('disconnected')
      expect(result.current.activeConnectionId).toBeNull()
      expect(result.current.agents).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('message subscriptions', () => {
    it('subscribers receive all messages', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))
      const received: unknown[] = []

      act(() => {
        result.current.subscribe((msg: unknown) => received.push(msg))
      })

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        MockWebSocket.instances[0].simulateMessage({ type: 'custom', data: 'hello' })
      })

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ type: 'custom', data: 'hello' })
    })
  })

  describe('sendMessage', () => {
    it('sends JSON message on open connection', async () => {
      const conn = makeConnection()
      const { result } = renderHook(() => useGatewayConnection([conn]))

      await act(async () => {
        await result.current.connect('test-conn-1')
      })

      act(() => {
        MockWebSocket.instances[0].simulateOpen()
      })

      act(() => {
        result.current.sendMessage({ type: 'test', payload: 'data' })
      })

      const sent = MockWebSocket.instances[0].sentMessages
      const testMsg = sent.find((m) => JSON.parse(m).type === 'test')
      expect(testMsg).toBeDefined()
      expect(JSON.parse(testMsg!).payload).toBe('data')
    })
  })
})
