'use client'

import { useState } from 'react'
import clsx from 'clsx'

import { CommentBody } from '@/components/comments/CommentBody'
import { CommentForm, GoogleIcon } from '@/components/comments/CommentForm'
import { GitHubIcon } from '@/components/SocialIcons'
import { formatRelativeTime } from '@/lib/formatDate'

function Avatar({ comment }) {
  if (comment.authorImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={comment.authorImage}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-8 w-8 flex-none border-2 border-black bg-white dark:border-white"
      />
    )
  }

  let initial = (comment.authorName || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 flex-none items-center justify-center border-2 border-black bg-zinc-100 text-sm font-bold text-zinc-600 dark:border-white dark:bg-zinc-800 dark:text-zinc-300"
    >
      {initial}
    </span>
  )
}

function Badge({ className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center border-2 px-1.5 text-[0.6875rem] font-bold uppercase leading-4 tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  )
}

function AuthorBadge({ comment }) {
  if (comment.isAdmin) {
    return <Badge className="border-black bg-highlight text-black">Author</Badge>
  }
  if (comment.isGuest) {
    return (
      <Badge className="border-zinc-400 text-zinc-500 dark:border-zinc-500 dark:text-zinc-400">
        Guest
      </Badge>
    )
  }
  if (comment.provider === 'github') {
    return (
      <span title="Signed in with GitHub">
        <GitHubIcon className="h-3.5 w-3.5 fill-zinc-500 dark:fill-zinc-400" />
      </span>
    )
  }
  if (comment.provider === 'google') {
    return (
      <span title="Signed in with Google">
        <GoogleIcon className="h-3.5 w-3.5" />
      </span>
    )
  }
  return null
}

function ActionButton(props) {
  return (
    <button
      type="button"
      className="text-xs font-medium text-zinc-500 underline-offset-2 hover:bg-highlight hover:text-black hover:underline disabled:opacity-50 dark:text-zinc-400"
      {...props}
    />
  )
}

export function CommentItem({ comment, slug, viewer, canReply, onPosted, onDelete }) {
  let [replying, setReplying] = useState(false)
  let [deleting, setDeleting] = useState(false)
  let [error, setError] = useState(null)

  async function handleDelete() {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete(comment.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  let exactTime = new Date(comment.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="flex gap-3">
      {comment.deleted ? (
        <span className="h-8 w-8 flex-none border-2 border-dashed border-zinc-300 dark:border-zinc-600" />
      ) : (
        <Avatar comment={comment} />
      )}

      <div className="min-w-0 flex-auto">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {comment.deleted ? (
            <span className="italic text-zinc-400 dark:text-zinc-500">[deleted]</span>
          ) : (
            <>
              <span className="font-bold text-black dark:text-white">{comment.authorName}</span>
              <AuthorBadge comment={comment} />
            </>
          )}
          <time
            dateTime={comment.createdAt}
            title={exactTime}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatRelativeTime(comment.createdAt)}
          </time>
        </div>

        {!comment.deleted && (
          <>
            <CommentBody>{comment.body}</CommentBody>

            <div className="mt-1 flex items-center gap-4">
              {canReply && (
                <ActionButton onClick={() => setReplying((value) => !value)}>
                  {replying ? 'Cancel reply' : 'Reply'}
                </ActionButton>
              )}
              {comment.isMine && (
                <ActionButton onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </ActionButton>
              )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </>
        )}

        {replying && (
          <div className="mt-3">
            <CommentForm
              slug={slug}
              viewer={viewer}
              parentId={comment.id}
              autoFocus
              onCancel={() => setReplying(false)}
              onPosted={(reply) => {
                setReplying(false)
                onPosted(reply)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
