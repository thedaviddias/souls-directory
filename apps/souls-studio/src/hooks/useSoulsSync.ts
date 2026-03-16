import { type ConvexReactClient, useConvex } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type PublishSoulResult, type RemoteSoulListItem, soulsApi } from '../lib/souls-convex-api'
import { invoke } from '../lib/tauri'
import {
  DEFAULT_SOULS_STORE,
  type LocalSoul,
  type SoulSnapshot,
  type SoulsStore,
  type SyncOperation,
  type SyncStatus,
} from '../types/soul'

interface UseSoulsSyncOptions {
  userId: string
  defaultOwnerHandle: string
  isAuthenticated?: boolean
  syncIntervalMs?: number
}

function now() {
  return Date.now()
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cloneStore(store: SoulsStore): SoulsStore {
  return {
    records: [...store.records],
    ops: [...store.ops],
    meta: { ...store.meta },
  }
}

function normalizeStore(store: Partial<SoulsStore> | null | undefined): SoulsStore {
  if (!store) {
    return cloneStore(DEFAULT_SOULS_STORE)
  }

  return {
    records: Array.isArray(store.records) ? (store.records as LocalSoul[]) : [],
    ops: Array.isArray(store.ops) ? (store.ops as SyncOperation[]) : [],
    meta: {
      schemaVersion: store.meta?.schemaVersion ?? 1,
      lastPullAt: store.meta?.lastPullAt,
      lastPushAt: store.meta?.lastPushAt,
    },
  }
}

function snapshotFromSoul(soul: LocalSoul): SoulSnapshot {
  return {
    name: soul.name,
    slug: soul.slug,
    tagline: soul.tagline,
    description: soul.description,
    content: soul.content,
    updatedAt: soul.remoteUpdatedAt ?? soul.localUpdatedAt,
  }
}

function ensureTagline(tagline: string) {
  const normalized = tagline.trim()
  return normalized.length > 0 ? normalized : 'An AI personality template'
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

async function sha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function upsertOperation(ops: SyncOperation[], nextOp: SyncOperation): SyncOperation[] {
  const filtered = ops.filter((op) => op.localSoulId !== nextOp.localSoulId)
  return [...filtered, nextOp].sort((a, b) => a.createdAt - b.createdAt)
}

function hasPendingOperation(store: SoulsStore, localSoulId: string) {
  return store.ops.some((op) => op.localSoulId === localSoulId)
}

export function useSoulsSync({
  userId,
  defaultOwnerHandle,
  isAuthenticated = true,
  syncIntervalMs,
}: UseSoulsSyncOptions) {
  const convex = useConvex() as ConvexReactClient
  const [store, setStore] = useState<SoulsStore>(cloneStore(DEFAULT_SOULS_STORE))
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<SyncStatus>({
    state: 'idle',
    pendingCount: 0,
    cappedByLimit: false,
  })

  const storeRef = useRef<SoulsStore>(cloneStore(DEFAULT_SOULS_STORE))
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncInFlightRef = useRef(false)

  const resolvedSyncIntervalMs = useMemo(() => {
    if (typeof syncIntervalMs === 'number' && syncIntervalMs > 0) {
      return syncIntervalMs
    }
    const fromEnv = Number(import.meta.env.VITE_SOULS_SYNC_INTERVAL_MS || 30000)
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 30000
  }, [syncIntervalMs])

  const persistStoreNow = useCallback(
    async (nextStore: SoulsStore) => {
      await invoke('save_souls_store', { userId, store: nextStore })
    },
    [userId]
  )

  const schedulePersist = useCallback(
    (nextStore: SoulsStore) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
      }
      persistTimerRef.current = setTimeout(() => {
        void persistStoreNow(nextStore)
      }, 400)
    },
    [persistStoreNow]
  )

  const applyStoreUpdate = useCallback(
    (
      updater: (current: SoulsStore) => SoulsStore,
      persistMode: 'debounced' | 'immediate' = 'debounced'
    ) => {
      setStore((current) => {
        const nextStore = updater(current)
        storeRef.current = nextStore

        if (persistMode === 'immediate') {
          void persistStoreNow(nextStore)
        } else {
          schedulePersist(nextStore)
        }

        // Notify listeners (e.g., useInstalledSoulSlugs) about store changes
        const slugs = nextStore.records
          .filter((r) => !r.deleted && r.ownerHandle)
          .map((r) => `${r.ownerHandle}/${r.slug}`.toLowerCase())
        window.dispatchEvent(new CustomEvent('souls-studio:store-updated', { detail: slugs }))

        return nextStore
      })
    },
    [persistStoreNow, schedulePersist]
  )

  const createSoul = useCallback(() => {
    const localId = generateId('local-soul')
    const createdAt = now()

    applyStoreUpdate((current) => {
      const nextStore = cloneStore(current)
      nextStore.records.unshift({
        localId,
        ownerHandle: defaultOwnerHandle,
        slug: `new-soul-${createdAt}`,
        name: 'Untitled Soul',
        tagline: '',
        description: '',
        content: '',
        localUpdatedAt: createdAt,
        syncState: 'pending',
      })
      return nextStore
    })

    return localId
  }, [applyStoreUpdate, defaultOwnerHandle])

  const updateSoulLocal = useCallback(
    (localSoulId: string, patch: Partial<LocalSoul>) => {
      applyStoreUpdate((current) => {
        const nextStore = cloneStore(current)
        nextStore.records = nextStore.records.map((record) => {
          if (record.localId !== localSoulId) {
            return record
          }

          return {
            ...record,
            ...patch,
            localUpdatedAt: now(),
            syncState: 'pending',
            lastError: undefined,
          }
        })

        return nextStore
      })
    },
    [applyStoreUpdate]
  )

  const saveSoul = useCallback(
    (localSoulId: string) => {
      applyStoreUpdate((current) => {
        const nextStore = cloneStore(current)
        const soul = nextStore.records.find((record) => record.localId === localSoulId)

        if (!soul || soul.deleted) {
          return current
        }

        const contentChanged = soul.content !== (soul.snapshot?.content ?? '')
        const metadataChanged =
          soul.name !== (soul.snapshot?.name ?? '') ||
          soul.slug !== (soul.snapshot?.slug ?? '') ||
          soul.tagline !== (soul.snapshot?.tagline ?? '') ||
          soul.description !== (soul.snapshot?.description ?? '')

        const opType =
          soul.remoteId && metadataChanged && !contentChanged ? 'updateMetadata' : 'publish'

        const op: SyncOperation = {
          id: generateId('sync-op'),
          localSoulId,
          type: opType,
          createdAt: now(),
          retryCount: 0,
        }

        nextStore.ops = upsertOperation(nextStore.ops, op)
        nextStore.records = nextStore.records.map((record) =>
          record.localId === localSoulId
            ? {
                ...record,
                syncState: 'pending',
                lastError: undefined,
              }
            : record
        )

        return nextStore
      })
    },
    [applyStoreUpdate]
  )

  const deleteSoul = useCallback(
    (localSoulId: string) => {
      applyStoreUpdate((current) => {
        const nextStore = cloneStore(current)
        const soul = nextStore.records.find((record) => record.localId === localSoulId)

        if (!soul) {
          return current
        }

        if (!soul.remoteId) {
          nextStore.records = nextStore.records.filter((record) => record.localId !== localSoulId)
          nextStore.ops = nextStore.ops.filter((op) => op.localSoulId !== localSoulId)
          return nextStore
        }

        nextStore.records = nextStore.records.map((record) =>
          record.localId === localSoulId
            ? {
                ...record,
                deleted: true,
                syncState: 'pending',
                localUpdatedAt: now(),
                lastError: undefined,
              }
            : record
        )

        nextStore.ops = upsertOperation(nextStore.ops, {
          id: generateId('sync-op'),
          localSoulId,
          type: 'deleteSoul',
          createdAt: now(),
          retryCount: 0,
        })

        return nextStore
      })
    },
    [applyStoreUpdate]
  )

  const syncNow = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    if (syncInFlightRef.current) {
      return
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus((current) => ({
        ...current,
        state: 'offline',
      }))
      return
    }

    syncInFlightRef.current = true
    setStatus((current) => ({
      ...current,
      state: 'syncing',
      lastError: undefined,
    }))

    try {
      const workingStore = cloneStore(storeRef.current)

      const orderedOps = [...workingStore.ops].sort((a, b) => a.createdAt - b.createdAt)
      for (const op of orderedOps) {
        const soulIndex = workingStore.records.findIndex(
          (record) => record.localId === op.localSoulId
        )
        const soul = soulIndex >= 0 ? workingStore.records[soulIndex] : null

        try {
          if (op.type === 'deleteSoul') {
            if (soul?.remoteId) {
              await convex.mutation(soulsApi.soulActions.deleteSoul, {
                soulId: soul.remoteId as never,
              })
            }

            workingStore.records = workingStore.records.filter(
              (record) => record.localId !== op.localSoulId
            )
            workingStore.ops = workingStore.ops.filter((queued) => queued.id !== op.id)
            continue
          }

          if (!soul) {
            workingStore.ops = workingStore.ops.filter((queued) => queued.id !== op.id)
            continue
          }

          if (op.type === 'updateMetadata' && soul.remoteId) {
            await convex.mutation(soulsApi.soulActions.updateMetadata, {
              soulId: soul.remoteId as never,
              name: soul.name,
              tagline: ensureTagline(soul.tagline),
              description: soul.description || undefined,
            })

            workingStore.records[soulIndex] = {
              ...soul,
              syncState: 'synced',
              lastError: undefined,
              snapshot: {
                ...(soul.snapshot ?? snapshotFromSoul(soul)),
                name: soul.name,
                slug: soul.slug,
                tagline: soul.tagline,
                description: soul.description,
                updatedAt: now(),
              },
            }

            workingStore.ops = workingStore.ops.filter((queued) => queued.id !== op.id)
            continue
          }

          const publishResult = (await convex.mutation(soulsApi.soulActions.publish, {
            slug: soul.slug.trim().toLowerCase(),
            name: soul.name.trim() || 'Untitled Soul',
            tagline: ensureTagline(soul.tagline),
            description: soul.description.trim() || undefined,
            content: soul.content,
            sha256: await sha256Hex(soul.content),
            versionBump: soul.remoteId ? 'patch' : undefined,
            source: { kind: 'paste' },
          })) as PublishSoulResult

          const syncedAt = now()
          workingStore.records[soulIndex] = {
            ...soul,
            remoteId: publishResult.soulId,
            ownerHandle: publishResult.ownerHandle ?? soul.ownerHandle ?? defaultOwnerHandle,
            slug: publishResult.slug,
            localUpdatedAt: syncedAt,
            remoteUpdatedAt: syncedAt,
            syncState: 'synced',
            lastError: undefined,
            deleted: false,
            snapshot: snapshotFromSoul({
              ...soul,
              remoteId: publishResult.soulId,
              ownerHandle: publishResult.ownerHandle ?? soul.ownerHandle ?? defaultOwnerHandle,
              slug: publishResult.slug,
              localUpdatedAt: syncedAt,
              remoteUpdatedAt: syncedAt,
              syncState: 'synced',
            }),
          }

          workingStore.ops = workingStore.ops.filter((queued) => queued.id !== op.id)
        } catch (error) {
          const message = toErrorMessage(error)
          workingStore.ops = workingStore.ops.map((queued) =>
            queued.id === op.id
              ? {
                  ...queued,
                  retryCount: queued.retryCount + 1,
                  lastError: message,
                }
              : queued
          )

          if (soulIndex >= 0) {
            workingStore.records[soulIndex] = {
              ...workingStore.records[soulIndex],
              syncState: 'error',
              lastError: message,
            }
          }

          break
        }
      }

      workingStore.meta.lastPushAt = now()

      const remoteItems = (await convex.query(soulsApi.users.getMySouls, {
        limit: 50,
      })) as RemoteSoulListItem[]
      const cappedByLimit = remoteItems.length >= 50

      const remoteSouls = await Promise.all(
        remoteItems.map(async (item) => {
          const ownerHandle = item.soul.ownerHandle ?? defaultOwnerHandle
          const content = (await convex.query(soulsApi.souls.getContent, {
            handle: ownerHandle,
            slug: item.soul.slug,
          })) as string | null

          return {
            remoteId: item.soul._id,
            ownerHandle,
            slug: item.soul.slug,
            name: item.soul.name,
            tagline: item.soul.tagline,
            description: item.soul.description ?? '',
            content: content ?? '',
            remoteUpdatedAt: item.soul.updatedAt,
          }
        })
      )

      const remoteById = new Map(remoteSouls.map((soul) => [soul.remoteId, soul]))
      const usedRemoteIds = new Set<string>()
      let nextOps = [...workingStore.ops]
      const nextRecords: LocalSoul[] = []

      for (const localSoul of workingStore.records) {
        if (localSoul.deleted) {
          if (hasPendingOperation(workingStore, localSoul.localId)) {
            nextRecords.push(localSoul)
          }
          continue
        }

        let remoteSoul = localSoul.remoteId ? remoteById.get(localSoul.remoteId) : undefined

        if (!remoteSoul && !localSoul.remoteId) {
          remoteSoul = remoteSouls.find(
            (candidate) =>
              candidate.slug === localSoul.slug &&
              candidate.ownerHandle === (localSoul.ownerHandle ?? defaultOwnerHandle)
          )
        }

        if (!remoteSoul) {
          if (localSoul.remoteId && !hasPendingOperation(workingStore, localSoul.localId)) {
            continue
          }

          nextRecords.push(localSoul)
          continue
        }

        usedRemoteIds.add(remoteSoul.remoteId)

        if (localSoul.localUpdatedAt > remoteSoul.remoteUpdatedAt) {
          nextRecords.push(localSoul)
          continue
        }

        nextOps = nextOps.filter((op) => op.localSoulId !== localSoul.localId)
        nextRecords.push({
          localId: localSoul.localId,
          remoteId: remoteSoul.remoteId,
          ownerHandle: remoteSoul.ownerHandle,
          slug: remoteSoul.slug,
          name: remoteSoul.name,
          tagline: remoteSoul.tagline,
          description: remoteSoul.description,
          content: remoteSoul.content,
          localUpdatedAt: remoteSoul.remoteUpdatedAt,
          remoteUpdatedAt: remoteSoul.remoteUpdatedAt,
          syncState: 'synced',
          snapshot: {
            name: remoteSoul.name,
            slug: remoteSoul.slug,
            tagline: remoteSoul.tagline,
            description: remoteSoul.description,
            content: remoteSoul.content,
            updatedAt: remoteSoul.remoteUpdatedAt,
          },
        })
      }

      for (const remoteSoul of remoteSouls) {
        if (usedRemoteIds.has(remoteSoul.remoteId)) {
          continue
        }

        nextRecords.push({
          localId: generateId('remote-soul'),
          remoteId: remoteSoul.remoteId,
          ownerHandle: remoteSoul.ownerHandle,
          slug: remoteSoul.slug,
          name: remoteSoul.name,
          tagline: remoteSoul.tagline,
          description: remoteSoul.description,
          content: remoteSoul.content,
          localUpdatedAt: remoteSoul.remoteUpdatedAt,
          remoteUpdatedAt: remoteSoul.remoteUpdatedAt,
          syncState: 'synced',
          snapshot: {
            name: remoteSoul.name,
            slug: remoteSoul.slug,
            tagline: remoteSoul.tagline,
            description: remoteSoul.description,
            content: remoteSoul.content,
            updatedAt: remoteSoul.remoteUpdatedAt,
          },
        })
      }

      workingStore.records = nextRecords.sort((a, b) => b.localUpdatedAt - a.localUpdatedAt)
      workingStore.ops = nextOps.sort((a, b) => a.createdAt - b.createdAt)
      workingStore.meta.lastPullAt = now()

      storeRef.current = workingStore
      setStore(workingStore)
      await persistStoreNow(workingStore)

      setStatus({
        state: 'idle',
        pendingCount: workingStore.ops.length,
        lastSyncAt: now(),
        cappedByLimit,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setStatus((current) => ({
        ...current,
        state: 'error',
        lastError: message,
        pendingCount: storeRef.current.ops.length,
      }))
    } finally {
      syncInFlightRef.current = false
    }
  }, [convex, defaultOwnerHandle, isAuthenticated, persistStoreNow])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    void invoke<SoulsStore>('get_souls_store', { userId })
      .then((loadedStore) => {
        if (cancelled) {
          return
        }

        const normalizedStore = normalizeStore(loadedStore)
        storeRef.current = normalizedStore
        setStore(normalizedStore)
        setStatus((current) => ({
          ...current,
          pendingCount: normalizedStore.ops.length,
        }))

        // Broadcast initial installed slugs
        const slugs = normalizedStore.records
          .filter((r) => !r.deleted && r.ownerHandle)
          .map((r) => `${r.ownerHandle}/${r.slug}`.toLowerCase())
        window.dispatchEvent(new CustomEvent('souls-studio:store-updated', { detail: slugs }))
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        const message = toErrorMessage(error)
        const fallbackStore = cloneStore(DEFAULT_SOULS_STORE)
        storeRef.current = fallbackStore
        setStore(fallbackStore)
        setStatus((current) => ({
          ...current,
          state: 'error',
          lastError: message,
          pendingCount: 0,
        }))
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
  }, [userId])

  useEffect(() => {
    if (loading) {
      return
    }

    void syncNow()

    const intervalId = setInterval(() => {
      void syncNow()
    }, resolvedSyncIntervalMs)

    const handleOnline = () => {
      void syncNow()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
    }
  }, [loading, resolvedSyncIntervalMs, syncNow])

  useEffect(() => {
    setStatus((current) => ({
      ...current,
      pendingCount: store.ops.length,
    }))
  }, [store.ops.length])

  return {
    souls: store.records.filter((record) => !record.deleted),
    loading,
    status,
    createSoul,
    updateSoulLocal,
    saveSoul,
    deleteSoul,
    syncNow,
  }
}
