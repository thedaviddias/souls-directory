import { type ConvexReactClient, useConvex } from 'convex/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type CachedCommunityRanking,
  type CachedCommunityRankingEntry,
  type CachedCommunitySitemapSoul,
  getCachedCommunityRanking,
  getCachedCommunitySitemap,
  getCachedSoulDetail,
  setCachedCommunityRanking,
  setCachedCommunitySitemap,
  setCachedSoulDetail,
} from '../lib/community-cache'
import { getConfiguredConvexUrl } from '../lib/convex-config'
import { type SitemapSoulItem, soulsApi } from '../lib/souls-convex-api'
import type { CommunitySoulSort } from '../types/community'

export interface CommunitySoul {
  id: string
  remoteId?: string
  ownerHandle: string
  slug: string
  name: string
  tagline: string
  description: string
  createdAt: number
  updatedAt: number
  downloads: number
  stars: number
}

interface UseCommunitySoulsOptions {
  enabled: boolean
  sort: CommunitySoulSort
}

interface RawSoulListResponse {
  items?: Array<{ soul?: unknown }>
  page?: Array<{ soul?: unknown }>
  nextCursor?: string | null
  continueCursor?: string | null
  hasMore?: boolean
}

interface RawSoulListItem {
  _id: string
  ownerHandle?: string | null
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  createdAt?: number
  updatedAt?: number
  stats?: { downloads?: number; stars?: number }
}

const SITEMAP_STALE_MS = 10 * 60 * 1000
const DETAIL_STALE_MS = 24 * 60 * 60 * 1000
const RANK_PAGES_PER_SYNC = 6
const PAGE_LIMIT = 50
const RANKED_SORTS = new Set<CommunitySoulSort>(['popular', 'trending', 'stars', 'hot'])

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

function soulKey(ownerHandle: string, slug: string) {
  return `${ownerHandle}/${slug}`.toLowerCase()
}

function normalizeSoulListResponse(value: unknown) {
  const response = (value ?? {}) as RawSoulListResponse
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.page)
      ? response.page
      : []
  const nextCursor =
    typeof response.nextCursor === 'string'
      ? response.nextCursor
      : typeof response.continueCursor === 'string'
        ? response.continueCursor
        : null
  const hasMore = Boolean(response.hasMore) || Boolean(nextCursor)
  return { items, nextCursor, hasMore }
}

function toRankingEntry(item: RawSoulListItem): CachedCommunityRankingEntry {
  const ownerHandle = item.ownerHandle ?? 'unknown'
  return {
    key: soulKey(ownerHandle, item.slug),
    remoteId: item._id,
    tagline: item.tagline ?? '',
    description: item.description ?? '',
    createdAt: item.createdAt ?? 0,
    updatedAt: item.updatedAt ?? 0,
    downloads: item.stats?.downloads ?? 0,
    stars: item.stats?.stars ?? 0,
  }
}

function mergeSouls(
  sitemapSouls: CachedCommunitySitemapSoul[],
  ranking: CachedCommunityRanking | null,
  sort: CommunitySoulSort
) {
  const rankingMap = new Map(
    (ranking?.entries ?? []).map((entry, index) => [entry.key, { entry, rank: index }])
  )

  const merged = sitemapSouls.map<CommunitySoul>((item) => {
    const key = soulKey(item.ownerHandle, item.slug)
    const ranked = rankingMap.get(key)?.entry
    return {
      id: key,
      remoteId: ranked?.remoteId,
      ownerHandle: item.ownerHandle,
      slug: item.slug,
      name: item.name,
      tagline: ranked?.tagline ?? '',
      description: ranked?.description ?? '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      downloads: ranked?.downloads ?? 0,
      stars: ranked?.stars ?? 0,
    }
  })

  merged.sort((a, b) => {
    if (sort === 'recent') {
      return b.updatedAt - a.updatedAt
    }

    if (sort === 'published') {
      return b.createdAt - a.createdAt
    }

    const rankA = rankingMap.get(a.id)?.rank ?? Number.MAX_SAFE_INTEGER
    const rankB = rankingMap.get(b.id)?.rank ?? Number.MAX_SAFE_INTEGER
    if (rankA !== rankB) {
      return rankA - rankB
    }

    return b.updatedAt - a.updatedAt
  })

  return merged
}

export function useCommunitySouls({ enabled, sort }: UseCommunitySoulsOptions) {
  const convex = useConvex() as ConvexReactClient
  const [souls, setSouls] = useState<CommunitySoul[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSoulId, setSelectedSoulId] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const convexConfigured = useMemo(() => Boolean(getConfiguredConvexUrl()), [])

  const patchSoul = useCallback(
    (soulId: string, updater: (current: CommunitySoul) => CommunitySoul) => {
      setSouls((current) =>
        current.map((soul) => {
          if (soul.id !== soulId) {
            return soul
          }
          return updater(soul)
        })
      )
    },
    []
  )

  const syncRankingCache = useCallback(
    async (current: CachedCommunityRanking | null, force: boolean) => {
      if (!RANKED_SORTS.has(sort)) {
        return { ranking: null as CachedCommunityRanking | null, incomplete: false }
      }

      const now = Date.now()
      const shouldReset = force || !current
      const existingEntries = shouldReset ? [] : current.entries
      const rankingMap = new Map(existingEntries.map((entry) => [entry.key, entry]))

      let cursor: string | undefined
      let complete = shouldReset ? false : current.complete
      if (!shouldReset && !current.complete && current.nextCursor) {
        cursor = current.nextCursor
      }

      const seenCursors = new Set<string>()
      let pagesFetched = 0

      if (!complete) {
        while (pagesFetched < RANK_PAGES_PER_SYNC) {
          if (cursor && seenCursors.has(cursor)) {
            break
          }
          if (cursor) {
            seenCursors.add(cursor)
          }

          const args: { sort: CommunitySoulSort; limit: number; cursor?: string } = {
            sort,
            limit: PAGE_LIMIT,
          }
          if (cursor) {
            args.cursor = cursor
          }

          const response = normalizeSoulListResponse(await convex.query(soulsApi.souls.list, args))
          for (const row of response.items) {
            const raw = row?.soul as RawSoulListItem | undefined
            if (!raw || !raw.slug) {
              continue
            }
            const entry = toRankingEntry(raw)
            if (!rankingMap.has(entry.key)) {
              rankingMap.set(entry.key, entry)
            }
          }

          pagesFetched += 1

          if (!response.hasMore || !response.nextCursor) {
            complete = true
            cursor = undefined
            break
          }

          cursor = response.nextCursor
        }
      }

      const ranking: CachedCommunityRanking = {
        sort,
        fetchedAt: now,
        entries: Array.from(rankingMap.values()),
        nextCursor: complete ? null : (cursor ?? null),
        complete,
      }

      await setCachedCommunityRanking(sort, ranking)
      return { ranking, incomplete: !ranking.complete }
    },
    [convex, sort]
  )

  const refresh = useCallback(
    async (force = false) => {
      if (!enabled) {
        return
      }

      if (!convexConfigured) {
        setSouls([])
        setError('Backend URL is not configured. Open My Souls to set it up.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [cachedSitemap, cachedRanking] = await Promise.all([
          getCachedCommunitySitemap(),
          getCachedCommunityRanking(sort),
        ])

        let sitemapSouls = cachedSitemap?.souls ?? []
        let ranking = cachedRanking

        if (sitemapSouls.length > 0) {
          setSouls(mergeSouls(sitemapSouls, ranking, sort))
          setLoading(false)
        }

        const now = Date.now()
        const shouldFetchSitemap =
          force || !cachedSitemap || now - cachedSitemap.fetchedAt > SITEMAP_STALE_MS

        if (shouldFetchSitemap) {
          const sitemapItems = (await convex.query(
            soulsApi.soulActions.listForSitemap,
            {}
          )) as SitemapSoulItem[]
          sitemapSouls = sitemapItems.map((item) => ({
            ownerHandle: item.ownerHandle,
            slug: item.slug,
            name: item.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))

          await setCachedCommunitySitemap({
            fetchedAt: now,
            souls: sitemapSouls,
          })
        }

        const rankingSync = await syncRankingCache(ranking, force)
        ranking = rankingSync.ranking
        setIsTruncated(rankingSync.incomplete)

        const mergedSouls = mergeSouls(sitemapSouls, ranking, sort)
        setSouls(mergedSouls)
        setSelectedSoulId((current) => {
          if (current && mergedSouls.some((item) => item.id === current)) {
            return current
          }
          return mergedSouls[0]?.id ?? null
        })
      } catch (queryError) {
        setError(toErrorMessage(queryError))
        setSouls([])
        setSelectedSoulId(null)
      } finally {
        setLoading(false)
      }
    },
    [convex, convexConfigured, enabled, sort, syncRankingCache]
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const selectedSoul = useMemo(
    () => souls.find((soul) => soul.id === selectedSoulId) ?? null,
    [selectedSoulId, souls]
  )

  useEffect(() => {
    if (!enabled || !selectedSoul) {
      setSelectedContent(null)
      setContentError(null)
      setContentLoading(false)
      return
    }

    let cancelled = false
    const cacheKey = selectedSoul.id

    const hydrateFromDetail = (detail: {
      remoteId?: string
      tagline: string
      description: string
      createdAt: number
      updatedAt: number
      downloads: number
      stars: number
      content: string
    }) => {
      patchSoul(cacheKey, (current) => ({
        ...current,
        remoteId: detail.remoteId ?? current.remoteId,
        tagline: detail.tagline || current.tagline,
        description: detail.description || current.description,
        createdAt: detail.createdAt || current.createdAt,
        updatedAt: detail.updatedAt || current.updatedAt,
        downloads: detail.downloads,
        stars: detail.stars,
      }))
      setSelectedContent(detail.content)
    }

    const load = async () => {
      setContentError(null)
      const cachedDetail = await getCachedSoulDetail(cacheKey)
      if (cancelled) {
        return
      }

      if (cachedDetail) {
        hydrateFromDetail(cachedDetail)
      } else {
        setSelectedContent(null)
      }

      const isFresh =
        Boolean(cachedDetail) && Date.now() - (cachedDetail?.fetchedAt ?? 0) < DETAIL_STALE_MS
      if (isFresh) {
        setContentLoading(false)
        return
      }

      setContentLoading(true)
      try {
        const detail = (await convex.query(soulsApi.souls.getByOwnerAndSlug, {
          handle: selectedSoul.ownerHandle,
          slug: selectedSoul.slug,
        })) as {
          soul?: {
            _id: string
            tagline?: string | null
            description?: string | null
            createdAt?: number
            updatedAt?: number
            stats?: { downloads?: number; stars?: number }
          } | null
          latestVersion?: { content?: string | null } | null
        } | null

        const soul = detail?.soul ?? null
        let content =
          typeof detail?.latestVersion?.content === 'string' ? detail.latestVersion.content : null
        if (content === null) {
          const fetchedContent = await convex.query(soulsApi.souls.getContent, {
            handle: selectedSoul.ownerHandle,
            slug: selectedSoul.slug,
          })
          content = typeof fetchedContent === 'string' ? fetchedContent : ''
        }

        const nextDetail = {
          fetchedAt: Date.now(),
          remoteId: soul?._id ?? selectedSoul.remoteId,
          tagline: soul?.tagline ?? selectedSoul.tagline,
          description: soul?.description ?? selectedSoul.description,
          createdAt: soul?.createdAt ?? selectedSoul.createdAt,
          updatedAt: soul?.updatedAt ?? selectedSoul.updatedAt,
          downloads: soul?.stats?.downloads ?? selectedSoul.downloads,
          stars: soul?.stats?.stars ?? selectedSoul.stars,
          content,
        }

        await setCachedSoulDetail(cacheKey, nextDetail)

        if (cancelled) {
          return
        }

        hydrateFromDetail(nextDetail)
      } catch (queryError) {
        if (cancelled) {
          return
        }

        if (!cachedDetail) {
          setContentError(toErrorMessage(queryError))
          setSelectedContent(null)
        }
      } finally {
        if (!cancelled) {
          setContentLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    convex,
    enabled,
    patchSoul,
    selectedSoul?.id,
    selectedSoul?.ownerHandle,
    selectedSoul?.slug,
    selectedSoul?.remoteId,
    selectedSoul?.tagline,
    selectedSoul?.description,
    selectedSoul?.createdAt,
    selectedSoul?.updatedAt,
    selectedSoul?.downloads,
    selectedSoul?.stars,
  ])

  return {
    souls,
    loading,
    error,
    isTruncated,
    selectedSoul,
    selectedSoulId,
    selectedContent,
    contentLoading,
    contentError,
    setSelectedSoulId,
    patchSoul,
    refresh: () => refresh(true),
  }
}
