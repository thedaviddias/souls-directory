import { useCallback, useEffect, useRef, useState } from 'react'
import { useGateway } from '../contexts/GatewayContext'
import type { AgentFileType } from '../types/soul'

const FETCH_TIMEOUT_MS = 5000
const UPDATE_TIMEOUT_MS = 8000

interface FileState {
  content: string | null
  loading: boolean
  error: string | null
}

interface AgentFilesState {
  files: Record<string, FileState>
  drafts: Record<string, string>
  deploying: string | null
}

export function useAgentFiles(agentId: string | null) {
  const { sendMessage, subscribe, unsubscribe, status } = useGateway()
  const [state, setState] = useState<AgentFilesState>({
    files: {},
    drafts: {},
    deploying: null,
  })

  const updateResolverRef = useRef<{
    resolve: (result: { success: boolean; error?: string }) => void
    timer: ReturnType<typeof setTimeout>
  } | null>(null)

  // Subscribe to gateway messages
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (msg: any) => {
      if (msg.type === 'agent_file' && msg.agentId === agentId) {
        setState((prev) => ({
          ...prev,
          files: {
            ...prev.files,
            [msg.file]: {
              content: msg.content ?? null,
              loading: false,
              error: null,
            },
          },
          drafts: {
            ...prev.drafts,
            [msg.file]: msg.content ?? '',
          },
        }))
      }

      if (msg.type === 'agent_file_updated' && msg.agentId === agentId) {
        const resolver = updateResolverRef.current
        if (resolver) {
          clearTimeout(resolver.timer)
          updateResolverRef.current = null
          resolver.resolve({
            success: msg.success ?? true,
            error: msg.error,
          })
        }

        if (msg.success !== false) {
          // Update the fetched content to match what was deployed
          setState((prev) => ({
            ...prev,
            files: {
              ...prev.files,
              [msg.file]: {
                ...prev.files[msg.file],
                content: prev.drafts[msg.file] ?? prev.files[msg.file]?.content ?? null,
              },
            },
            deploying: null,
          }))
        } else {
          setState((prev) => ({ ...prev, deploying: null }))
        }
      }
    }

    subscribe(handler)
    return () => unsubscribe(handler)
  }, [agentId, subscribe, unsubscribe])

  // Fetch files when agent changes
  useEffect(() => {
    if (!agentId || status !== 'connected') {
      setState({ files: {}, drafts: {}, deploying: null })
      return
    }

    // Start loading soul.md
    setState({
      files: {
        'soul.md': { content: null, loading: true, error: null },
      },
      drafts: {},
      deploying: null,
    })

    sendMessage({ type: 'get_agent_file', agentId, file: 'soul.md' })

    // Timeout — if gateway doesn't respond, show error
    const timer = setTimeout(() => {
      setState((prev) => {
        const updated = { ...prev }
        for (const file of Object.keys(updated.files)) {
          if (updated.files[file].loading) {
            updated.files[file] = {
              content: null,
              loading: false,
              error: 'Gateway did not respond. File operations may not be supported.',
            }
          }
        }
        return updated
      })
    }, FETCH_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [agentId, status, sendMessage])

  const fetchFile = useCallback(
    (file: AgentFileType) => {
      if (!agentId || status !== 'connected') return

      setState((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          [file]: { content: null, loading: true, error: null },
        },
      }))

      sendMessage({ type: 'get_agent_file', agentId, file })

      setTimeout(() => {
        setState((prev) => {
          if (prev.files[file]?.loading) {
            return {
              ...prev,
              files: {
                ...prev.files,
                [file]: {
                  content: null,
                  loading: false,
                  error: 'Gateway did not respond. File operations may not be supported.',
                },
              },
            }
          }
          return prev
        })
      }, FETCH_TIMEOUT_MS)
    },
    [agentId, status, sendMessage]
  )

  const updateDraft = useCallback((file: string, content: string) => {
    setState((prev) => ({
      ...prev,
      drafts: { ...prev.drafts, [file]: content },
    }))
  }, [])

  const deployFile = useCallback(
    (file: AgentFileType, content: string): Promise<{ success: boolean; error?: string }> => {
      if (!agentId || status !== 'connected') {
        return Promise.resolve({ success: false, error: 'Not connected' })
      }

      setState((prev) => ({ ...prev, deploying: file }))
      sendMessage({ type: 'update_agent_file', agentId, file, content })

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          updateResolverRef.current = null
          setState((prev) => ({ ...prev, deploying: null }))
          resolve({
            success: false,
            error: 'Deploy timed out. Gateway may not support file updates.',
          })
        }, UPDATE_TIMEOUT_MS)

        updateResolverRef.current = { resolve, timer }
      })
    },
    [agentId, status, sendMessage]
  )

  const isDirty = useCallback(
    (file: string) => {
      const fetched = state.files[file]?.content
      const draft = state.drafts[file]
      if (fetched == null || draft == null) return false
      return fetched !== draft
    },
    [state.files, state.drafts]
  )

  const revert = useCallback(
    (file: string) => {
      const fetched = state.files[file]?.content
      if (fetched != null) {
        setState((prev) => ({
          ...prev,
          drafts: { ...prev.drafts, [file]: fetched },
        }))
      }
    },
    [state.files]
  )

  return {
    files: state.files,
    drafts: state.drafts,
    deploying: state.deploying,
    fetchFile,
    updateDraft,
    deployFile,
    isDirty,
    revert,
  }
}
