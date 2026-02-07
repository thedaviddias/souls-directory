'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { CategorySelect } from '@/components/upload/category-select'
import { MarkdownEditor } from '@/components/upload/markdown-editor'
import { ReviewStep } from '@/components/upload/review-step'
import { TagInput } from '@/components/upload/tag-input'
import type { Id } from '@/convex/_generated/dataModel'
import { useAnalytics } from '@/hooks/use-analytics'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useGitHubImport } from '@/hooks/use-github-import'
import { useSoulMetadata } from '@/hooks/use-soul-metadata'
import { useWizardNavigation } from '@/hooks/use-wizard-navigation'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { ROUTES, soulPath } from '@/lib/routes'
import { formatBytes, formatPublishError, isMarkdownFile } from '@/lib/upload-utils'
import { bumpVersion } from '@/lib/version-utils'
import { useMutation, useQuery } from 'convex/react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FileText,
  Github,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

// =============================================================================
// Constants
// =============================================================================

type SourceType = 'file' | 'github' | 'paste'
type VersionBump = 'major' | 'minor' | 'patch'

const inputClasses =
  'w-full px-3 py-2 rounded-md bg-bg border border-border text-text text-sm placeholder-text-muted focus:outline-none focus:border-text-secondary transition-colors'

// =============================================================================
// Main Component
// =============================================================================

export function UploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analytics = useAnalytics()
  const { isAuthenticated, isLoading: authLoading } = useAuthStatus()

  // Edit mode: check for handle and slug in URL params
  const editHandle = searchParams.get('handle')
  const editSlug = searchParams.get('slug')
  const isEditMode = !!(editHandle && editSlug)

  // Fork mode: pre-fill from another soul (fork param is "handle/slug")
  const forkParam = searchParams.get('fork')
  const [forkHandle, forkSlugOnly] = forkParam?.includes('/')
    ? [forkParam.split('/')[0], forkParam.split('/').slice(1).join('/')]
    : [null, forkParam]
  const isForkMode = !isEditMode && !!forkParam && !!forkHandle && !!forkSlugOnly

  // Mutations
  const publishSoul = useMutation(api.soulActions.publish)
  const updateMetadata = useMutation(api.soulActions.updateMetadata)

  // Queries
  const categories = useQuery(api.categories.list) ?? []
  const allTags = useQuery(api.tags.list, { limit: 100 }) ?? []
  const tagSuggestions = useQuery(api.tags.search, { query: '', limit: 20 }) ?? []

  // Fetch existing soul data for editing
  const existingSoul = useQuery(
    api.soulActions.getForEdit,
    isEditMode && isAuthenticated && editHandle && editSlug
      ? { handle: editHandle, slug: editSlug }
      : 'skip'
  )

  // Fetch fork source content and soul id when forking
  const forkContent = useQuery(
    api.souls.getContent,
    isForkMode && forkHandle && forkSlugOnly ? { handle: forkHandle, slug: forkSlugOnly } : 'skip'
  )
  const forkSoulData = useQuery(
    api.souls.getByOwnerAndSlug,
    isForkMode && forkHandle && forkSlugOnly ? { handle: forkHandle, slug: forkSlugOnly } : 'skip'
  )

  // ==========================================================================
  // Local state (source, versioning, UI)
  // ==========================================================================

  const [sourceType, setSourceType] = useState<SourceType>('file')
  const [versionBump, setVersionBump] = useState<VersionBump>('patch')
  const [changelog, setChangelog] = useState('')
  const [isUpdate, setIsUpdate] = useState(false)
  const [metadataOnly, setMetadataOnly] = useState(true) // Default to metadata-only in edit mode
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [justPublishedName, setJustPublishedName] = useState<string | null>(null)
  const [forkedFromSoulId, setForkedFromSoulId] = useState<Id<'souls'> | null>(null)
  const hasInitializedEditMode = useRef(false)
  const hasInitializedForkMode = useRef(false)

  // ==========================================================================
  // Custom hooks
  // ==========================================================================

  const fileUpload = useFileUpload(sourceType)

  const githubImport = useGitHubImport(fileUpload.setContent)

  const soulMetadata = useSoulMetadata(fileUpload.content, fileUpload.normalizedFiles, categories)

  const wizardReadiness = useMemo(() => {
    const metadataOnlyBlocked = isEditMode && !metadataOnly && fileUpload.files.length === 0
    return {
      source:
        isEditMode && fileUpload.content.length > 0
          ? true
          : isForkMode && fileUpload.content.length > 0
            ? true
            : sourceType === 'paste'
              ? fileUpload.content.trim().length > 0
              : sourceType === 'file'
                ? fileUpload.sourceValidation.ready
                : !!githubImport.githubSource && fileUpload.content.length > 0,
      review: fileUpload.content.length > 0,
      metadata: soulMetadata.metadataValidation.ready && !metadataOnlyBlocked,
      publish: true,
    }
  }, [
    isEditMode,
    isForkMode,
    metadataOnly,
    sourceType,
    fileUpload.files.length,
    fileUpload.sourceValidation.ready,
    fileUpload.content,
    githubImport.githubSource,
    soulMetadata.metadataValidation.ready,
  ])

  const wizard = useWizardNavigation(
    wizardReadiness,
    isEditMode ? 'metadata' : isForkMode ? 'review' : undefined
  )

  // ==========================================================================
  // Auth redirect
  // ==========================================================================

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(ROUTES.login)
    }
  }, [authLoading, isAuthenticated, router])

  // ==========================================================================
  // Fork mode initialization (pre-fill content from another soul)
  // ==========================================================================

  useEffect(() => {
    if (
      !isForkMode ||
      !forkHandle ||
      !forkSlugOnly ||
      forkContent === undefined ||
      !forkSoulData?.soul ||
      hasInitializedForkMode.current
    )
      return
    if (forkContent === null) return
    hasInitializedForkMode.current = true
    fileUpload.setContent(forkContent)
    setForkedFromSoulId(forkSoulData.soul._id)
  }, [isForkMode, forkHandle, forkSlugOnly, forkContent, forkSoulData, fileUpload])

  // ==========================================================================
  // Edit mode initialization
  // ==========================================================================

  useEffect(() => {
    // Only run once when existing soul data loads
    if (!isEditMode || !existingSoul || hasInitializedEditMode.current) return

    hasInitializedEditMode.current = true

    // Set update mode
    setIsUpdate(true)

    // Pre-populate content
    if (existingSoul.latestVersion?.content) {
      fileUpload.setContent(existingSoul.latestVersion.content)
    }

    // Pre-populate metadata
    const tagNames =
      existingSoul.tags
        ?.map((t: { name?: string } | null) => t?.name)
        .filter((name: string | undefined): name is string => !!name) ?? []

    soulMetadata.populateFromInitialData({
      displayName: existingSoul.soul.name,
      slug: existingSoul.soul.slug,
      tagline: existingSoul.soul.tagline,
      description: existingSoul.soul.description ?? '',
      categoryId: existingSoul.soul.categoryId ?? null,
      tags: tagNames,
    })

    // No need to set step — initialStep:'metadata' handles edit mode landing.
  }, [isEditMode, existingSoul, fileUpload, soulMetadata])

  // Handle invalid edit attempt (not owner or soul doesn't exist)
  useEffect(() => {
    if (isEditMode && existingSoul === null && !authLoading) {
      setError('You do not have permission to edit this soul or it does not exist.')
    }
  }, [isEditMode, existingSoul, authLoading])

  // ==========================================================================
  // Publish
  // ==========================================================================

  const handlePublish = async () => {
    if (!soulMetadata.metadataValidation.ready || isPublishing) return

    setIsPublishing(true)
    setError(null)

    try {
      // Resolve tag IDs from existing tags only (users cannot create new tags)
      const tagIds: Id<'tags'>[] = []
      for (const tagName of soulMetadata.selectedTags) {
        const existingTag = allTags.find(
          (t: { _id: Id<'tags'>; name: string }) => t.name.toLowerCase() === tagName.toLowerCase()
        )
        if (existingTag?._id) {
          tagIds.push(existingTag._id as Id<'tags'>)
        }
        // Skip tags that don't exist - only admins can create new tags
      }

      // Metadata-only update (no new version)
      if (isEditMode && metadataOnly && existingSoul?.soul._id) {
        await updateMetadata({
          soulId: existingSoul.soul._id,
          name: soulMetadata.displayName.trim(),
          tagline: soulMetadata.tagline.trim() || 'An AI personality template',
          description: soulMetadata.description.trim() || undefined,
          categoryId: soulMetadata.categoryId || null,
          tagIds: tagIds.length > 0 ? tagIds : [],
        })

        const categorySlug = soulMetadata.categoryId
          ? (categories as Array<{ _id: Id<'categories'>; slug: string }>).find(
              (c) => c._id === soulMetadata.categoryId
            )?.slug
          : undefined
        analytics.track('soul_upload', { category: categorySlug })
        setSuccess(true)
        const handleForRedirect = isEditMode && editHandle ? editHandle : ''
        setTimeout(() => {
          router.push(soulPath(handleForRedirect, soulMetadata.slug.trim().toLowerCase()))
        }, 1500)
        return
      }

      // Full publish (creates new version)
      // Hash the content
      const encoder = new TextEncoder()
      const data = encoder.encode(fileUpload.content)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      // Build publish args
      const publishArgs: Record<string, unknown> = {
        slug: soulMetadata.slug.trim().toLowerCase(),
        name: soulMetadata.displayName.trim(),
        tagline: soulMetadata.tagline.trim() || 'An AI personality template',
        description: soulMetadata.description.trim() || undefined,
        content: fileUpload.content,
        sha256,
        categoryId: soulMetadata.categoryId || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      }

      // Add version/changelog for updates
      if (isUpdate || isEditMode) {
        publishArgs.versionBump = versionBump
        if (changelog.trim()) {
          publishArgs.changelog = changelog.trim()
        }
      }

      // Add source info
      if (sourceType === 'github' && githubImport.githubSource) {
        const gs = githubImport.githubSource
        publishArgs.source = {
          kind: 'github',
          url: gs.url,
          repo: `${gs.owner}/${gs.repo}`,
          ref: gs.ref,
          commit: gs.commit,
          path: gs.path || '',
          importedAt: Date.now(),
        }
      } else if (sourceType === 'paste') {
        publishArgs.source = { kind: 'paste' }
      } else {
        publishArgs.source = { kind: 'upload' }
      }

      // When forking, pass the original soul id (new soul only)
      if (!isEditMode && forkedFromSoulId) {
        publishArgs.forkedFromId = forkedFromSoulId
      }

      const result = (await publishSoul(publishArgs)) as { ownerHandle?: string; slug: string }

      const categorySlug = soulMetadata.categoryId
        ? (categories as Array<{ _id: Id<'categories'>; slug: string }>).find(
            (c) => c._id === soulMetadata.categoryId
          )?.slug
        : undefined
      analytics.track('soul_upload', { category: categorySlug })

      const ownerHandle = result?.ownerHandle ?? ''
      const publishedSlug = result?.slug ?? soulMetadata.slug.trim().toLowerCase()

      // Check if there are more files to process
      if (fileUpload.hasNextFile) {
        // Show success feedback with the just-published name
        const publishedName = soulMetadata.displayName
        setJustPublishedName(publishedName)
        setTimeout(() => setJustPublishedName(null), 5000)

        // Move to next file and reset wizard to review step
        fileUpload.goToNextFile()
        wizard.goToStep('review')
        setIsPublishing(false)
        setError(null)
        // Reset version/changelog state for next file
        setIsUpdate(false)
        setChangelog('')
      } else {
        // Last file - show success and redirect
        setSuccess(true)
        setTimeout(() => {
          router.push(soulPath(ownerHandle, publishedSlug))
        }, 1500)
      }
    } catch (err) {
      logger.error('Soul publish failed', err, {
        slug: soulMetadata.slug,
        isEditMode,
      })
      setError(formatPublishError(err))
    } finally {
      setIsPublishing(false)
    }
  }

  // ==========================================================================
  // Render
  // ==========================================================================

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-5 h-5 motion-safe:animate-spin text-text-secondary" />
      </div>
    )
  }

  // Show loading while fetching existing soul data in edit mode
  if (isEditMode && existingSoul === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        <Loader2 className="w-5 h-5 motion-safe:animate-spin text-text-secondary" />
        <p className="text-sm text-text-muted">Loading soul data...</p>
      </div>
    )
  }

  const { content } = fileUpload
  const { autoDetected } = soulMetadata
  const { currentStep, steps, canProceed } = wizard

  return (
    <div id="main-content" className="flex-1">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { name: 'Dashboard', href: '/dashboard' },
            { name: isEditMode ? 'Edit Soul' : 'Upload' },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-text">
            {isEditMode ? 'Edit Soul' : isUpdate ? 'Update Soul' : 'Upload Soul'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isEditMode
              ? `Update details or publish a new version of "${existingSoul?.soul?.name ?? editSlug}"`
              : 'Share your AI personality template with the community'}
          </p>
          {isEditMode && existingSoul?.latestVersion && (
            <p className="text-xs text-text-muted mt-2 font-mono">
              Current version: v{existingSoul.latestVersion.version}
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep
              const isPast = steps.findIndex((s) => s.id === currentStep) > index
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => wizard.goToStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      isActive
                        ? 'bg-text text-bg font-medium'
                        : isPast
                          ? 'bg-surface text-text hover:bg-elevated'
                          : 'text-text-muted'
                    }`}
                  >
                    {isPast && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-4 h-4 flex items-center justify-center text-xs font-mono">
                        {index + 1}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronDown className="w-4 h-4 text-border mx-1 -rotate-90" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Multi-file progress indicator */}
          {fileUpload.totalMarkdownFiles > 1 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="font-medium text-text">File {fileUpload.currentFileIndex + 1}</span>
              <span className="text-text-muted">of {fileUpload.totalMarkdownFiles}</span>
              {/* Progress dots */}
              <div className="flex gap-1 ml-2">
                {Array.from({ length: fileUpload.totalMarkdownFiles }, (_, i) => (
                  <div
                    key={`progress-dot-${fileUpload.totalMarkdownFiles}-${i}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < fileUpload.currentFileIndex
                        ? 'bg-success'
                        : i === fileUpload.currentFileIndex
                          ? 'bg-text'
                          : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Alerts */}
          {(error || githubImport.error || fileUpload.fileError) && (
            <section
              role="alert"
              className="bg-error/5 border border-error/20 rounded-lg p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200"
            >
              <p className="text-sm text-error flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error || githubImport.error || fileUpload.fileError}
              </p>
            </section>
          )}

          {success && (
            <output className="block bg-success/5 border border-success/20 rounded-lg p-4">
              <p className="text-sm text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Soul published successfully! Redirecting...
              </p>
            </output>
          )}

          {/* Multi-file: show banner when a file was just published */}
          {justPublishedName && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">
                  Published &quot;{justPublishedName}&quot;!
                </p>
                <p className="text-xs text-success/80">
                  Now reviewing file {fileUpload.currentFileIndex + 1} of{' '}
                  {fileUpload.totalMarkdownFiles}
                </p>
              </div>
            </div>
          )}

          {/* Step validation alerts */}
          {currentStep === 'metadata' && soulMetadata.metadataValidation.issues.length > 0 && (
            <section role="alert" className="bg-error/5 border border-error/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-error mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Please fix the following:
              </h3>
              <ul className="list-disc list-inside text-xs text-error/80 space-y-1">
                {soulMetadata.metadataValidation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </section>
          )}

          {currentStep === 'publish' && soulMetadata.metadataValidation.issues.length > 0 && (
            <section role="alert" className="bg-error/5 border border-error/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-error mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Please go back and fix:
              </h3>
              <ul className="list-disc list-inside text-xs text-error/80 space-y-1">
                {soulMetadata.metadataValidation.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </section>
          )}

          {/* ============================================================ */}
          {/* STEP 1: Source */}
          {/* ============================================================ */}
          {currentStep === 'source' && (
            <>
              <section className="bg-surface border border-border rounded-lg p-5">
                <h2 className="text-sm font-medium text-text mb-4">Choose Source</h2>
                {isForkMode && forkSoulData?.soul && (
                  <p className="text-xs text-text-muted mb-4">
                    Forking from{' '}
                    <span className="text-text-secondary">{forkSoulData.soul.name}</span>
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceType('paste')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      sourceType === 'paste'
                        ? 'border-text bg-text/5'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <Clipboard className="w-5 h-5 text-text-secondary" />
                    <span className="text-sm text-text">Paste or type</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('file')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      sourceType === 'file'
                        ? 'border-text bg-text/5'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-text-secondary" />
                    <span className="text-sm text-text">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('github')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      sourceType === 'github'
                        ? 'border-text bg-text/5'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <Github className="w-5 h-5 text-text-secondary" />
                    <span className="text-sm text-text">Import from GitHub</span>
                  </button>
                </div>
              </section>

              {/* Paste / type */}
              {sourceType === 'paste' && (
                <section className="bg-surface border border-border rounded-lg p-5">
                  <h2 className="text-sm font-medium text-text mb-4">Paste or type</h2>
                  <p className="text-xs text-text-muted mb-4">
                    Paste or type your SOUL.md content below. Only plain text and markdown are
                    stored.
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <MarkdownEditor
                      value={fileUpload.content}
                      onChange={fileUpload.setContent}
                      placeholder="Paste or type markdown..."
                      aria-label="Soul content"
                      minHeight="min-h-128"
                      maxHeight="max-h-192"
                    />
                  </div>
                  {fileUpload.content.length > 0 && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => fileUpload.setContent('')}
                        className="text-xs text-text-secondary hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded"
                        aria-label="Clear pasted content"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* File Upload */}
              {sourceType === 'file' && (
                <section className="bg-surface border border-border rounded-lg p-5">
                  <h2 className="text-sm font-medium text-text mb-4">Upload Files</h2>

                  {/* Hidden file input */}
                  <input
                    ref={fileUpload.fileInputRef}
                    type="file"
                    onChange={fileUpload.handleFileSelect}
                    multiple
                    accept=".md,.markdown,.txt,.json,.yaml,.yml"
                    className="hidden"
                  />

                  {/* Drop zone - click triggers file input via ref */}
                  <button
                    type="button"
                    onClick={() => fileUpload.fileInputRef.current?.click()}
                    onDragOver={fileUpload.handleDragOver}
                    onDragLeave={fileUpload.handleDragLeave}
                    onDrop={fileUpload.handleDrop}
                    className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      fileUpload.isDragging
                        ? 'border-text bg-text/5'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-3 text-text-muted" />
                    <p className="text-sm text-text mb-1">Drag and drop your markdown file here</p>
                    <p className="text-xs text-text-muted mb-4">or click anywhere to browse</p>
                    <span className="px-3 py-1.5 text-sm border border-border text-text-secondary rounded-md hover:border-text-muted transition-colors inline-block">
                      Select Files
                    </span>
                  </button>

                  {/* File List */}
                  {fileUpload.normalizedFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted font-mono">
                          {fileUpload.normalizedFiles.length} file
                          {fileUpload.normalizedFiles.length !== 1 ? 's' : ''} (
                          {formatBytes(fileUpload.files.reduce((sum, f) => sum + f.size, 0))})
                        </span>
                        <button
                          type="button"
                          onClick={fileUpload.clearFiles}
                          className="text-xs text-error hover:text-error/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded"
                        >
                          Clear all
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {fileUpload.normalizedFiles.map(({ file, path }, fileIndex) => (
                          <li
                            key={path}
                            className="flex items-center justify-between bg-bg rounded-md px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                              <span
                                className={`text-xs truncate ${
                                  isMarkdownFile(path)
                                    ? 'text-text font-medium'
                                    : 'text-text-secondary'
                                }`}
                              >
                                {path}
                              </span>
                              <span className="text-xs text-text-muted font-mono">
                                ({formatBytes(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => fileUpload.removeFile(fileIndex)}
                              aria-label={`Remove ${path}`}
                              className="text-text-muted hover:text-error transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text rounded"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* GitHub Import */}
              {sourceType === 'github' && (
                <section className="bg-surface border border-border rounded-lg p-5">
                  <h2 className="text-sm font-medium text-text mb-4 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Repository
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="github-url" className="block text-xs text-text-muted mb-1">
                        Repository URL
                      </label>
                      <input
                        type="url"
                        id="github-url"
                        value={githubImport.githubUrl}
                        onChange={(e) => githubImport.setGithubUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        disabled={!!githubImport.githubSource}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${inputClasses} disabled:opacity-50`}
                      />
                      <p className="mt-1 text-xs text-text-muted">
                        Supports URLs to repos, folders, or specific files
                      </p>
                    </div>

                    {!githubImport.githubSource && (
                      <button
                        type="button"
                        onClick={githubImport.detect}
                        disabled={!githubImport.githubUrl.trim() || githubImport.isDetecting}
                        className="inline-flex items-center gap-2 h-8 px-4 text-sm font-bold bg-text text-bg hover:bg-text/90 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {githubImport.isDetecting ? (
                          <>
                            <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          'Detect SOUL.md'
                        )}
                      </button>
                    )}

                    {githubImport.githubSource && (
                      <>
                        <div className="bg-bg rounded-md p-3 space-y-2">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-text-muted">Repository:</span>
                            <a
                              href={`https://github.com/${githubImport.githubSource.owner}/${githubImport.githubSource.repo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text hover:text-text/80 underline underline-offset-4 flex items-center gap-1"
                            >
                              {githubImport.githubSource.owner}/{githubImport.githubSource.repo}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-text-muted">Commit:</span>
                            <code className="text-text-secondary font-mono">
                              {githubImport.githubSource.commit.slice(0, 7)}
                            </code>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={githubImport.reset}
                          className="text-xs text-text-secondary hover:text-text transition-colors"
                        >
                          Try a different URL
                        </button>
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Review */}
          {/* ============================================================ */}
          {currentStep === 'review' && (
            <ReviewStep
              content={content}
              onContentChange={fileUpload.setContent}
              isForkMode={isForkMode}
              forkSourceName={forkSoulData?.soul?.name}
              sourceType={sourceType}
              githubSource={githubImport.githubSource}
              fileLabel={
                sourceType === 'paste'
                  ? 'Paste / Type'
                  : fileUpload.markdownFiles[fileUpload.currentFileIndex]?.path || 'Uploaded file'
              }
            />
          )}

          {/* ============================================================ */}
          {/* STEP 3: Metadata */}
          {/* ============================================================ */}
          {currentStep === 'metadata' && (
            <>
              {/* Auto-fill notice */}
              {Object.values(autoDetected).some(Boolean) && (
                <div className="bg-surface border border-border rounded-lg px-4 py-3 flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-text">Fields auto-filled from your file</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      We parsed your markdown structure to pre-fill the form. Everything is
                      editable.
                    </p>
                  </div>
                </div>
              )}

              <section className="bg-surface border border-border rounded-lg p-5">
                <h2 className="text-sm font-medium text-text mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="flex items-center gap-2 text-xs text-text-muted mb-1"
                    >
                      Display Name *
                      {autoDetected.name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                          from heading
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      value={soulMetadata.displayName}
                      onChange={(e) => soulMetadata.setDisplayName(e.target.value)}
                      placeholder="My Awesome Soul"
                      autoComplete="off"
                      spellCheck={false}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="flex items-center gap-2 text-xs text-text-muted mb-1"
                    >
                      Slug *
                      {autoDetected.slug && !isEditMode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                          from name
                        </span>
                      )}
                      {isEditMode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                          locked
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-mono">
                        souls.directory/souls/{isEditMode && editHandle ? `${editHandle}/` : ''}
                      </span>
                      <input
                        type="text"
                        id="slug"
                        value={soulMetadata.slug}
                        onChange={(e) =>
                          soulMetadata.setSlug(
                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          )
                        }
                        placeholder="my-awesome-soul"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={isEditMode}
                        className={`flex-1 ${inputClasses} ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {isEditMode && (
                      <p className="mt-1 text-xs text-text-muted">
                        Slug cannot be changed after creation
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="tagline"
                      className="flex items-center gap-2 text-xs text-text-muted mb-1"
                    >
                      Tagline
                      {autoDetected.tagline && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                          from italic line
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="tagline"
                      value={soulMetadata.tagline}
                      onChange={(e) => soulMetadata.setTagline(e.target.value)}
                      maxLength={100}
                      placeholder="A brief, catchy description"
                      autoComplete="off"
                      spellCheck={true}
                      className={inputClasses}
                    />
                    <p className="mt-1 text-xs text-text-muted font-mono">
                      {soulMetadata.tagline.length}/100
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="flex items-center gap-2 text-xs text-text-muted mb-1"
                    >
                      Description
                      {autoDetected.description && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                          from ## Vibe
                        </span>
                      )}
                    </label>
                    <textarea
                      id="description"
                      value={soulMetadata.description}
                      onChange={(e) => soulMetadata.setDescription(e.target.value)}
                      maxLength={500}
                      rows={5}
                      placeholder="Describe what makes this soul unique…"
                      autoComplete="off"
                      spellCheck={true}
                      className={`${inputClasses} resize-y`}
                    />
                    <p className="mt-1 text-xs text-text-muted font-mono">
                      {soulMetadata.description.length}/500
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-surface border border-border rounded-lg p-5">
                  <h2 className="text-sm font-medium text-text mb-4">Category &amp; Tags</h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="category-search"
                        className="flex items-center gap-2 text-xs text-text-muted mb-1"
                      >
                        Category
                        {autoDetected.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-text/5 text-text-secondary border border-border">
                            from folder
                          </span>
                        )}
                      </label>

                      <CategorySelect
                        categories={categories}
                        selectedCategoryId={soulMetadata.categoryId}
                        onSelect={soulMetadata.setCategoryId}
                        inputClasses={inputClasses}
                      />
                    </div>

                    <TagInput
                      selectedTags={soulMetadata.selectedTags}
                      tagInput={soulMetadata.tagInput}
                      onTagInputChange={soulMetadata.setTagInput}
                      onAddTag={soulMetadata.addTag}
                      onRemoveTag={soulMetadata.removeTag}
                      suggestions={tagSuggestions}
                      inputClasses={inputClasses}
                      maxTags={5}
                      autoDetected={autoDetected.tags}
                    />
                  </div>
                </section>

                {/* Versioning (for updates/edits) */}
                {(isUpdate || isEditMode) && (
                  <section className="bg-surface border border-border rounded-lg p-5">
                    <h2 className="text-sm font-medium text-text mb-4">Update Type</h2>

                    {/* Edit mode: choice between metadata-only or new version */}
                    {isEditMode && (
                      <div className="space-y-3 mb-4">
                        <label
                          className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                            metadataOnly
                              ? 'border-text bg-text/5'
                              : 'border-border hover:border-text-muted'
                          }`}
                        >
                          <input
                            type="radio"
                            name="updateType"
                            checked={metadataOnly}
                            onChange={() => setMetadataOnly(true)}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-text">Update metadata only</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              Change name, tagline, description, category, or tags without creating
                              a new version.
                              {existingSoul?.latestVersion && (
                                <span className="block mt-1 font-mono">
                                  Version stays at v{existingSoul.latestVersion.version}
                                </span>
                              )}
                            </p>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                            !metadataOnly
                              ? 'border-text bg-text/5'
                              : 'border-border hover:border-text-muted'
                          }`}
                        >
                          <input
                            type="radio"
                            name="updateType"
                            checked={!metadataOnly}
                            onChange={() => setMetadataOnly(false)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text">Publish new version</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              Update the content and create a new version.
                              {existingSoul?.latestVersion && (
                                <span className="block mt-1 font-mono">
                                  New version will be v
                                  {bumpVersion(existingSoul.latestVersion.version, versionBump)}
                                </span>
                              )}
                            </p>
                            {!metadataOnly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  wizard.setStep('source')
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors"
                              >
                                <Upload className="w-3 h-3" />
                                Upload new content
                              </button>
                            )}
                          </div>
                        </label>
                      </div>
                    )}

                    {isEditMode && !metadataOnly && fileUpload.files.length === 0 && (
                      <div
                        role="alert"
                        className="mt-4 p-3 rounded-md bg-error/5 border border-error/20 text-sm text-error"
                      >
                        Upload new content using the link above before continuing, or switch to
                        &quot;Update metadata only&quot; to save without a new version.
                      </div>
                    )}

                    {/* Version bump options (shown when publishing new version) */}
                    {(!isEditMode || !metadataOnly) && (
                      <div className="space-y-4">
                        {isEditMode && existingSoul?.latestVersion && (
                          <div className="p-3 bg-bg rounded-md">
                            <p className="text-xs text-text-muted">
                              Current version:{' '}
                              <span className="font-mono text-text">
                                v{existingSoul.latestVersion.version}
                              </span>{' '}
                              &rarr;{' '}
                              <span className="font-mono text-text font-medium">
                                v{bumpVersion(existingSoul.latestVersion.version, versionBump)}
                              </span>
                            </p>
                          </div>
                        )}

                        <fieldset className="border-0 p-0 m-0">
                          <legend className="block text-xs text-text-muted mb-2">
                            Version Bump
                          </legend>
                          <div className="flex gap-2">
                            {(['patch', 'minor', 'major'] as const).map((bump) => (
                              <button
                                key={bump}
                                type="button"
                                onClick={() => setVersionBump(bump)}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                  versionBump === bump
                                    ? 'border-text bg-text/5 text-text'
                                    : 'border-border text-text-secondary hover:border-text-muted'
                                }`}
                              >
                                {bump.charAt(0).toUpperCase() + bump.slice(1)}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-text-muted">
                            {versionBump === 'major' &&
                              'Major: Breaking changes or complete rewrites'}
                            {versionBump === 'minor' &&
                              'Minor: New features or significant improvements'}
                            {versionBump === 'patch' && 'Patch: Bug fixes or small tweaks'}
                          </p>
                        </fieldset>

                        <div>
                          <label htmlFor="changelog" className="block text-xs text-text-muted mb-1">
                            Changelog
                          </label>
                          <textarea
                            id="changelog"
                            value={changelog}
                            onChange={(e) => setChangelog(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Describe what changed in this version…"
                            autoComplete="off"
                            spellCheck={true}
                            className={`${inputClasses} resize-y`}
                            aria-describedby="changelog-counter"
                          />
                          <p
                            id="changelog-counter"
                            className="mt-1 text-xs text-text-muted font-mono"
                            aria-live="polite"
                          >
                            {changelog.length}/500
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* STEP 4: Publish */}
          {/* ============================================================ */}
          {currentStep === 'publish' && (
            <section className="bg-surface border border-border rounded-lg p-5">
              <h2 className="text-sm font-medium text-text mb-4">Review &amp; Publish</h2>
              <dl className="space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-text-muted">Name</dt>
                  <dd className="text-text font-medium">{soulMetadata.displayName}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-text-muted">Slug</dt>
                  <dd className="text-text font-mono">{soulMetadata.slug}</dd>
                </div>
                {soulMetadata.tagline && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-text-muted">Tagline</dt>
                    <dd className="text-text-secondary">{soulMetadata.tagline}</dd>
                  </div>
                )}
                {soulMetadata.categoryId && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-text-muted">Category</dt>
                    <dd className="text-text-secondary">
                      {
                        categories.find(
                          (c: { _id: string; name: string }) => c._id === soulMetadata.categoryId
                        )?.name
                      }
                    </dd>
                  </div>
                )}
                {soulMetadata.selectedTags.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-text-muted">Tags</dt>
                    <dd className="text-text-secondary">{soulMetadata.selectedTags.join(', ')}</dd>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <dt className="text-text-muted">Source</dt>
                  <dd className="text-text-secondary">
                    {sourceType === 'github'
                      ? 'GitHub Import'
                      : sourceType === 'paste'
                        ? 'Paste / Type'
                        : 'File Upload'}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-text-muted">Content Size</dt>
                  <dd className="text-text-secondary font-mono">
                    {content.length.toLocaleString()} chars
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {isEditMode && currentStep === 'source' ? (
                <Button type="button" variant="ghost" onClick={() => wizard.setStep('metadata')}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Details
                </Button>
              ) : currentStep !== 'source' &&
                !(isEditMode && (currentStep === 'metadata' || currentStep === 'review')) &&
                !(isForkMode && currentStep === 'review') ? (
                <Button type="button" variant="ghost" onClick={wizard.goBack}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Link
                  href={
                    isEditMode && editHandle && editSlug
                      ? soulPath(editHandle, editSlug)
                      : ROUTES.dashboard
                  }
                  className="text-sm text-text-secondary hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded"
                >
                  Cancel
                </Link>
              )}
            </div>

            <div>
              {currentStep !== 'publish' ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={wizard.goNext}
                  disabled={!canProceed}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePublish}
                  disabled={!soulMetadata.metadataValidation.ready || success}
                  loading={isPublishing}
                  loadingText={isEditMode && metadataOnly ? 'Saving...' : 'Publishing...'}
                >
                  <Upload className="w-4 h-4" />
                  {isEditMode && metadataOnly
                    ? 'Save Changes'
                    : isEditMode
                      ? 'Publish New Version'
                      : 'Publish Soul'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
