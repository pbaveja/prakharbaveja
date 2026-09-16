'use client'

import { useEffect, useId, useState } from 'react'
import clsx from 'clsx'
import { signIn, signOut } from 'next-auth/react'

import { Button } from '@/components/Button'
import { CommentBody } from '@/components/comments/CommentBody'
import { GitHubIcon } from '@/components/SocialIcons'
import { MAX_BODY_LENGTH, MAX_NAME_LENGTH } from '@/lib/commentValidation'
import { fetchJson } from '@/lib/fetchJson'

const GUEST_NAME_STORAGE_KEY = 'comments:guest-name'

const inputClassName =
  'w-full rounded-none border-2 border-black bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-highlight dark:border-white dark:bg-zinc-900 dark:text-zinc-100'

export function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function readStoredName() {
  try {
    return window.localStorage.getItem(GUEST_NAME_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function storeName(name) {
  try {
    window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, name)
  } catch {
    // Storage can be unavailable (private mode); remembering the name is optional.
  }
}

function TabButton({ active, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'border-2 border-black px-2.5 py-1 text-xs font-medium transition dark:border-white',
        active
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
      )}
      {...props}
    />
  )
}

export function SignInButtons() {
  let callbackUrl = () => `${window.location.pathname}#comments`

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="secondary"
        onClick={() => signIn('github', { redirectTo: callbackUrl() })}
      >
        <GitHubIcon className="h-4 w-4 fill-current" />
        Sign in with GitHub
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => signIn('google', { redirectTo: callbackUrl() })}
      >
        <GoogleIcon className="h-4 w-4" />
        Sign in with Google
      </Button>
    </div>
  )
}

export function ViewerBar({ viewer, onSignedOut }) {
  let [signingOut, setSigningOut] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="flex min-w-0 items-center gap-2">
        {viewer.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewer.image}
            alt=""
            width={24}
            height={24}
            referrerPolicy="no-referrer"
            className="h-6 w-6 flex-none border-2 border-black dark:border-white"
          />
        )}
        <span className="truncate">
          Commenting as <strong className="text-black dark:text-white">{viewer.name}</strong>
        </span>
      </span>
      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true)
          await signOut({ redirect: false })
          setSigningOut(false)
          onSignedOut()
        }}
        className="flex-none underline decoration-2 underline-offset-2 hover:bg-highlight hover:text-black disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  )
}

/**
 * New comment / reply form. Guests type a display name; signed-in users post
 * under their account. In `auth-only` mode guests only see the sign-in buttons
 * (rendered by the parent), so this form is never shown to them.
 */
export function CommentForm({ slug, viewer, parentId = null, onPosted, onCancel, autoFocus }) {
  let id = useId()
  let [body, setBody] = useState('')
  let [name, setName] = useState('')
  let [website, setWebsite] = useState('')
  let [tab, setTab] = useState('write')
  let [submitting, setSubmitting] = useState(false)
  let [error, setError] = useState(null)

  useEffect(() => {
    if (!viewer) setName(readStoredName())
  }, [viewer])

  let isGuest = !viewer
  let length = body.trim().length
  let canSubmit = length > 0 && length <= MAX_BODY_LENGTH && (!isGuest || name.trim()) && !submitting

  async function submit(event) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      let data = await fetchJson(`/api/comments/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentId, name: isGuest ? name : undefined, website }),
      })
      if (isGuest) storeName(name.trim())
      setBody('')
      setTab('write')
      if (data.comment) onPosted(data.comment)
    } catch (err) {
      setError(
        err.status === 429
          ? 'You are commenting too quickly. Please wait a bit and try again.'
          : err.message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {isGuest && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-name`} className="text-sm font-medium text-black dark:text-white">
            Name <span className="font-normal text-zinc-500">(posting as a guest)</span>
          </label>
          <input
            id={`${id}-name`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            required
            className={clsx(inputClassName, 'sm:max-w-xs')}
          />
        </div>
      )}

      {/* Honeypot: hidden from people and screen readers, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
              Write
            </TabButton>
            <TabButton
              active={tab === 'preview'}
              onClick={() => setTab('preview')}
              disabled={!body.trim()}
            >
              Preview
            </TabButton>
          </div>
          <span
            className={clsx(
              'text-xs tabular-nums',
              length > MAX_BODY_LENGTH ? 'font-bold text-red-600' : 'text-zinc-500',
            )}
          >
            {length}/{MAX_BODY_LENGTH}
          </span>
        </div>

        {tab === 'write' ? (
          <textarea
            aria-label={parentId ? 'Write a reply' : 'Write a comment'}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            autoFocus={autoFocus}
            rows={parentId ? 3 : 4}
            placeholder={parentId ? 'Write a reply…' : 'Share your thoughts… Markdown supported.'}
            className={clsx(inputClassName, 'resize-y')}
          />
        ) : (
          <div className="min-h-[6rem] border-2 border-dashed border-black px-3 py-1 dark:border-white">
            <CommentBody>{body}</CommentBody>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Posting…' : parentId ? 'Reply' : 'Post comment'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
