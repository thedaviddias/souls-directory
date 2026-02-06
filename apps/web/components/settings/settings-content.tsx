'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { useAuthStatus } from '@/hooks/use-auth-status'
import { api } from '@/lib/convex-api'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/lib/routes'
import { useMutation } from 'convex/react'
import { AlertTriangle, ExternalLink, Loader2, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const inputClasses =
  'w-full px-3 py-2 rounded-md bg-bg border border-border text-text text-sm placeholder-text-muted focus:outline-none focus:border-text-secondary transition-colors'

const inputErrorClasses =
  'w-full px-3 py-2 rounded-md bg-bg border border-error text-text text-sm placeholder-text-muted focus:outline-none focus:border-error transition-colors'

/** Client-side URL validation matching server rules (http/https, no localhost/private IPs). */
function isValidWebsiteUrl(urlString: string): boolean {
  if (!urlString.trim()) return true
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    if (!hostname || hostname === '.' || hostname.startsWith('.')) return false
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return false
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    )
      return false
    if (!hostname.includes('.')) return false
    if (urlString.length > 2048) return false
    return true
  } catch {
    return false
  }
}

const MASTODON_HANDLE_REGEX = /^@?[a-zA-Z0-9_]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const BLUESKY_HANDLE_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
const SOCIAL_HANDLE_MAX_LENGTH = 100

export function SettingsContent() {
  const router = useRouter()
  const { me, isAuthenticated, isLoading: authLoading, signOut } = useAuthStatus()
  const deleteAccount = useMutation(api.users.deleteAccount)

  // UI state
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(ROUTES.login)
    }
  }, [authLoading, isAuthenticated, router])

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      toast.error('Please confirm account deletion')
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount({})
      await signOut()
      toast.success('Account deleted')
      router.push(ROUTES.home)
    } catch (error) {
      logger.error('Failed to delete account', error, { userId: me?._id })
      toast.error('Failed to delete account')
      setIsDeleting(false)
    }
  }

  // Show loading state
  if (authLoading || !me) {
    return (
      <output
        className="flex flex-1 items-center justify-center"
        aria-label="Loading settings..."
        htmlFor=""
      >
        <Loader2 className="w-5 h-5 animate-spin text-text-secondary" aria-hidden />
        <span className="sr-only">Loading settings...</span>
      </output>
    )
  }

  return (
    <div id="main-content" className="flex-1">
      <PageContainer>
        {/* Breadcrumb */}
        <Breadcrumb items={[{ name: 'Settings' }]} className="mb-6" />

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-xl font-medium text-text">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your profile and account</p>
        </div>

        {/* Profile Section — form is a child component so useState
            initializes AFTER me is guaranteed to be available */}
        <ProfileForm me={me} />

        {/* Danger Zone — wrapper uses padding to avoid margin collapse with section above */}
        <div className="pt-14">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="text-xs uppercase tracking-wider text-error font-mono mb-5">
              Danger Zone
            </legend>

            <div className="bg-surface border border-error/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-md bg-error/10">
                  <AlertTriangle className="w-4 h-4 text-error" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text mb-1">Delete Account</h3>
                  <p id="danger-desc" className="text-xs text-text-secondary mb-2">
                    This will permanently delete your account and anonymize all your souls.
                  </p>
                  <p id="danger-note" className="text-xs text-text-muted mb-4">
                    Your souls will remain publicly available but will be attributed to
                    &quot;Deleted User&quot; instead of your profile.
                  </p>

                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-bg text-error focus:ring-error"
                      aria-describedby="danger-desc danger-note"
                    />
                    <span className="text-xs text-text-secondary">
                      I understand this action is permanent and cannot be undone
                    </span>
                  </label>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!confirmDelete}
                    loading={isDeleting}
                    loadingText="Deleting..."
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </PageContainer>
    </div>
  )
}

/**
 * ProfileForm — child component that mounts only after `me` is loaded.
 * This guarantees useState initializes with actual user data, avoiding
 * the timing issue where useEffect + parent loading guard can leave
 * form fields empty.
 */
interface UserProfile {
  _id: string
  name?: string
  handle?: string | null
  displayName?: string
  bio?: string
  image?: string
  email?: string
  websiteUrl?: string
  xHandle?: string
  mastodonHandle?: string
  blueskyHandle?: string
  githubHandle?: string
  role?: string
  githubId?: string
  githubCreatedAt?: number
  createdAt?: number
  updatedAt?: number
}

function ProfileForm({ me }: { me: UserProfile }) {
  const updateProfile = useMutation(api.users.updateProfile)

  // Form state — initialized directly from `me` since this component
  // only mounts when `me` is guaranteed to be available
  const [bio, setBio] = useState(me.bio || '')
  const [websiteUrl, setWebsiteUrl] = useState(me.websiteUrl || '')
  const [xHandle, setXHandle] = useState(me.xHandle || '')
  const [mastodonHandle, setMastodonHandle] = useState(me.mastodonHandle || '')
  const [blueskyHandle, setBlueskyHandle] = useState(me.blueskyHandle || '')

  const [isSaving, setIsSaving] = useState(false)

  // Keep form in sync if `me` changes externally (e.g., Convex subscription update)
  useEffect(() => {
    setBio(me.bio || '')
    setWebsiteUrl(me.websiteUrl || '')
    setXHandle(me.xHandle || '')
    setMastodonHandle(me.mastodonHandle || '')
    setBlueskyHandle(me.blueskyHandle || '')
  }, [me.bio, me.websiteUrl, me.xHandle, me.mastodonHandle, me.blueskyHandle])

  // Dirty state: any editable field differs from initial
  const isDirty =
    bio !== (me.bio || '') ||
    websiteUrl !== (me.websiteUrl || '') ||
    xHandle !== (me.xHandle || '') ||
    mastodonHandle !== (me.mastodonHandle || '') ||
    blueskyHandle !== (me.blueskyHandle || '')

  // Client-side validation (match server rules)
  const websiteUrlError =
    websiteUrl.trim() && !isValidWebsiteUrl(websiteUrl)
      ? 'Enter a valid https URL (no localhost or private IPs)'
      : null
  const xHandleNormalized = xHandle.trim().replace(/^@/, '')
  const xHandleError =
    xHandleNormalized && !/^[a-zA-Z0-9_]{1,15}$/.test(xHandleNormalized)
      ? 'X handle: 1–15 letters, numbers, or underscores'
      : null
  const mastodonTrimmed = mastodonHandle.trim().replace(/^@/, '')
  const mastodonWithAt = mastodonTrimmed.includes('@') ? mastodonTrimmed : `@${mastodonTrimmed}`
  const mastodonError =
    mastodonTrimmed &&
    (mastodonWithAt.length > SOCIAL_HANDLE_MAX_LENGTH ||
      !MASTODON_HANDLE_REGEX.test(mastodonWithAt))
      ? 'Use format: user@instance.social'
      : null
  const blueskyLower = blueskyHandle.trim().toLowerCase()
  const blueskyError =
    blueskyLower &&
    (blueskyLower.length > SOCIAL_HANDLE_MAX_LENGTH || !BLUESKY_HANDLE_REGEX.test(blueskyLower))
      ? 'Use format: handle.bsky.social'
      : null

  const hasValidationErrors = Boolean(
    websiteUrlError || xHandleError || mastodonError || blueskyError
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasValidationErrors) {
      toast.error('Fix errors before saving')
      return
    }
    if (!isDirty) {
      toast.info('No changes to save')
      return
    }
    setIsSaving(true)

    try {
      await updateProfile({
        bio: bio.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        xHandle: xHandleNormalized || undefined,
        mastodonHandle: mastodonTrimmed || undefined,
        blueskyHandle: blueskyLower || undefined,
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      logger.error('Failed to update profile', error, { userId: me?._id })
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mb-24">
      <h2 className="text-xs uppercase tracking-wider text-text-muted font-mono mb-6">Profile</h2>

      <form onSubmit={handleSave} className="space-y-14">
        {/* Account Info (read-only) */}
        <fieldset className="min-w-0 border border-border rounded-lg bg-surface p-6">
          <legend className="text-xs uppercase tracking-wider text-text-muted font-mono mb-5">
            Account Information
          </legend>
          <div className="space-y-5">
            {/* Profile image and name from GitHub */}
            <div className="flex items-center gap-4 pb-5 border-b border-border">
              {me.image ? (
                <img
                  src={me.image}
                  alt={me.name || me.displayName || me.handle || 'Profile'}
                  className="w-16 h-16 rounded-full border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-bg border border-border flex items-center justify-center text-xl text-text font-mono">
                  {(
                    me.name?.charAt(0) ||
                    me.displayName?.charAt(0) ||
                    me.handle?.charAt(0) ||
                    'U'
                  ).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-text font-medium">
                  {me.name || me.displayName || me.handle}
                </p>
                <p className="text-xs text-text-muted">Profile picture and name from GitHub</p>
              </div>
            </div>

            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
              <div>
                <dt className="text-xs text-text-muted mb-1">Handle</dt>
                <dd className="text-sm text-text font-mono">@{me.handle}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted mb-1">Display Name</dt>
                <dd className="text-sm text-text">{me.displayName || me.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted mb-1">Email</dt>
                <dd className="text-sm text-text">{me.email}</dd>
              </div>
              {me.githubHandle && (
                <div>
                  <dt className="text-xs text-text-muted mb-1">GitHub</dt>
                  <dd className="text-sm text-text">
                    <a
                      href={`https://github.com/${me.githubHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text-secondary underline font-mono"
                    >
                      @{me.githubHandle}
                    </a>
                  </dd>
                </div>
              )}
              {me.createdAt && (
                <div>
                  <dt className="text-xs text-text-muted mb-1">Member Since</dt>
                  <dd className="text-sm text-text">
                    {new Date(me.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            {me.handle && (
              <p className="pt-2 border-t border-border">
                <Link
                  href={ROUTES.userProfile(me.handle)}
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                  View public profile
                </Link>
              </p>
            )}
          </div>
        </fieldset>

        {/* Editable Fields */}
        <fieldset className="min-w-0 border border-border rounded-lg bg-surface p-6 space-y-5">
          <legend className="text-xs uppercase tracking-wider text-text-muted font-mono mb-5">
            Editable Profile
          </legend>
          <div>
            <label htmlFor="bio" className="block text-xs text-text-muted mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us about yourself"
              className={`${inputClasses} resize-y`}
              aria-describedby="bio-counter"
            />
            <p
              id="bio-counter"
              className="mt-1 text-xs text-text-muted font-mono"
              aria-live="polite"
            >
              {bio.length}/500
            </p>
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-xs text-text-muted mb-1">
              Website
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className={websiteUrlError ? inputErrorClasses : inputClasses}
              aria-invalid={Boolean(websiteUrlError)}
              aria-describedby={websiteUrlError ? 'websiteUrl-error' : undefined}
            />
            {websiteUrlError && (
              <p id="websiteUrl-error" className="mt-1 text-xs text-error" role="alert">
                {websiteUrlError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="xHandle" className="block text-xs text-text-muted mb-1">
              X Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                @
              </span>
              <input
                type="text"
                id="xHandle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value.replace(/^@/, ''))}
                maxLength={15}
                placeholder="username"
                className={`${xHandleError ? inputErrorClasses : inputClasses} pl-7`}
                aria-label="X handle, without the @ symbol"
                aria-invalid={Boolean(xHandleError)}
                aria-describedby={xHandleError ? 'xHandle-error' : undefined}
              />
            </div>
            {xHandleError && (
              <p id="xHandle-error" className="mt-1 text-xs text-error" role="alert">
                {xHandleError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mastodonHandle" className="block text-xs text-text-muted mb-1">
              Mastodon
            </label>
            <input
              type="text"
              id="mastodonHandle"
              value={mastodonHandle}
              onChange={(e) => setMastodonHandle(e.target.value)}
              maxLength={SOCIAL_HANDLE_MAX_LENGTH + 1}
              placeholder="user@mastodon.social"
              className={mastodonError ? inputErrorClasses : inputClasses}
              aria-invalid={Boolean(mastodonError)}
              aria-describedby={mastodonError ? 'mastodonHandle-error' : undefined}
            />
            {mastodonError && (
              <p id="mastodonHandle-error" className="mt-1 text-xs text-error" role="alert">
                {mastodonError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="blueskyHandle" className="block text-xs text-text-muted mb-1">
              Bluesky
            </label>
            <input
              type="text"
              id="blueskyHandle"
              value={blueskyHandle}
              onChange={(e) => setBlueskyHandle(e.target.value)}
              maxLength={SOCIAL_HANDLE_MAX_LENGTH + 1}
              placeholder="handle.bsky.social"
              className={blueskyError ? inputErrorClasses : inputClasses}
              aria-invalid={Boolean(blueskyError)}
              aria-describedby={blueskyError ? 'blueskyHandle-error' : undefined}
            />
            {blueskyError && (
              <p id="blueskyHandle-error" className="mt-1 text-xs text-error" role="alert">
                {blueskyError}
              </p>
            )}
          </div>
        </fieldset>

        {/* Save Button */}
        <output
          className="flex justify-end"
          htmlFor="bio websiteUrl xHandle mastodonHandle blueskyHandle"
          aria-live="polite"
        >
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
            loadingText="Saving..."
            aria-disabled={!isDirty || hasValidationErrors}
            className={
              !isDirty || hasValidationErrors
                ? 'opacity-50 cursor-not-allowed hover:opacity-50 hover:bg-text'
                : undefined
            }
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </output>
      </form>
    </section>
  )
}
