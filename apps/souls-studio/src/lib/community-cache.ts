import type { CommunitySoulSort } from '../types/community'
import { invoke, isTauriRuntime } from './tauri'

const DB_NAME = 'souls-studio-community-cache'
const DB_VERSION = 1
const STORE_NAME = 'entries'

const KEY_SITEMAP = 'community:sitemap:v1'

function rankingKey(sort: CommunitySoulSort) {
  return `community:ranking:${sort}:v1`
}

function detailKey(key: string) {
  return `community:detail:${key}:v1`
}

let dbPromise: Promise<IDBDatabase> | null = null

interface CacheRecord {
  key: string
  value: unknown
  updatedAt: number
}

export interface CachedCommunitySitemapSoul {
  ownerHandle: string
  slug: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface CachedCommunitySitemap {
  fetchedAt: number
  souls: CachedCommunitySitemapSoul[]
}

export interface CachedCommunityRankingEntry {
  key: string
  remoteId?: string
  tagline: string
  description: string
  createdAt: number
  updatedAt: number
  downloads: number
  stars: number
}

export interface CachedCommunityRanking {
  sort: CommunitySoulSort
  fetchedAt: number
  entries: CachedCommunityRankingEntry[]
  nextCursor: string | null
  complete: boolean
}

export interface CachedSoulDetail {
  fetchedAt: number
  remoteId?: string
  tagline: string
  description: string
  createdAt: number
  updatedAt: number
  downloads: number
  stars: number
  content: string
}

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function getDb() {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open cache DB'))
  })

  return dbPromise
}

async function readValue<T>(key: string): Promise<T | null> {
  if (isTauriRuntime()) {
    try {
      const value = await invoke<T | null>('get_community_cache_entry', { key })
      return value ?? null
    } catch {
      // Fallback to IndexedDB below.
    }
  }

  if (!canUseIndexedDb()) {
    return null
  }

  try {
    const db = await getDb()
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        const record = request.result as CacheRecord | undefined
        resolve((record?.value as T | undefined) ?? null)
      }
      request.onerror = () => reject(request.error ?? new Error('Cache read failed'))
    })
  } catch {
    return null
  }
}

async function writeValue<T>(key: string, value: T) {
  if (isTauriRuntime()) {
    try {
      await invoke('save_community_cache_entry', { key, value })
      return
    } catch {
      // Fallback to IndexedDB below.
    }
  }

  if (!canUseIndexedDb()) {
    return
  }

  try {
    const db = await getDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put({
        key,
        value,
        updatedAt: Date.now(),
      } satisfies CacheRecord)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Cache write failed'))
    })
  } catch {
    // noop
  }
}

export function getCachedCommunitySitemap() {
  return readValue<CachedCommunitySitemap>(KEY_SITEMAP)
}

export function setCachedCommunitySitemap(value: CachedCommunitySitemap) {
  return writeValue(KEY_SITEMAP, value)
}

export function getCachedCommunityRanking(sort: CommunitySoulSort) {
  return readValue<CachedCommunityRanking>(rankingKey(sort))
}

export function setCachedCommunityRanking(sort: CommunitySoulSort, value: CachedCommunityRanking) {
  return writeValue(rankingKey(sort), value)
}

export function getCachedSoulDetail(key: string) {
  return readValue<CachedSoulDetail>(detailKey(key))
}

export function setCachedSoulDetail(key: string, value: CachedSoulDetail) {
  return writeValue(detailKey(key), value)
}

export async function clearCommunityCache() {
  if (isTauriRuntime()) {
    try {
      await invoke('clear_community_cache')
      return
    } catch {
      // noop
    }
  }
}
