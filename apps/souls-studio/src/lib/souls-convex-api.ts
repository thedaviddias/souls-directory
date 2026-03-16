import { makeFunctionReference } from 'convex/server'

export interface MeUser {
  _id: string
  handle?: string | null
  githubHandle?: string | null
  name?: string | null
  displayName?: string | null
}

export interface RemoteSoul {
  _id: string
  slug: string
  ownerHandle?: string | null
  name: string
  tagline: string
  description?: string
  stats?: {
    downloads?: number
    stars?: number
  }
  createdAt: number
  updatedAt: number
}

export interface RemoteSoulListItem {
  soul: RemoteSoul
}

export interface RemoteSoulListPage {
  items: RemoteSoulListItem[]
  nextCursor?: string | null
}

export interface SitemapSoulItem {
  ownerHandle: string
  slug: string
  name: string
  updatedAt: number
  createdAt: number
}

export interface PublishSoulResult {
  soulId: string
  versionId: string
  version: string
  isNew: boolean
  ownerHandle?: string
  slug: string
}

export const soulsApi = {
  users: {
    me: makeFunctionReference<'query'>('users:me'),
    getMySouls: makeFunctionReference<'query'>('users:getMySouls'),
  },
  souls: {
    list: makeFunctionReference<'query'>('souls:list'),
    getByOwnerAndSlug: makeFunctionReference<'query'>('souls:getByOwnerAndSlug'),
    getContent: makeFunctionReference<'query'>('souls:getContent'),
    toggleStar: makeFunctionReference<'mutation'>('souls:toggleStar'),
    isStarred: makeFunctionReference<'query'>('souls:isStarred'),
    trackDownload: makeFunctionReference<'mutation'>('souls:trackDownload'),
  },
  soulActions: {
    listForSitemap: makeFunctionReference<'query'>('soulActions:listForSitemap'),
    publish: makeFunctionReference<'mutation'>('soulActions:publish'),
    updateMetadata: makeFunctionReference<'mutation'>('soulActions:updateMetadata'),
    deleteSoul: makeFunctionReference<'mutation'>('soulActions:deleteSoul'),
  },
} as const
