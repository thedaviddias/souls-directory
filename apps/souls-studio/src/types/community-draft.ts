export interface CommunitySoulDraft {
  name: string
  slug: string
  tagline: string
  description: string
  content: string
}

export interface CommunitySoulImportRequest {
  requestId: number
  draft: CommunitySoulDraft
}
