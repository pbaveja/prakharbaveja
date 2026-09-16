'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

import { fetchJson } from '@/lib/fetchJson'

const STATUS_STYLES = {
  visible: 'border-green-700 text-green-700 dark:border-green-400 dark:text-green-400',
  hidden: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400',
  deleted: 'border-zinc-400 text-zinc-500',
}

function ActionButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'border-2 border-black bg-white px-2 py-0.5 text-xs font-medium text-zinc-800 transition hover:bg-highlight hover:text-black disabled:opacity-50 dark:border-white dark:bg-zinc-900 dark:text-zinc-200',
        className,
      )}
      {...props}
    />
  )
}

function shortHash(value) {
  return `${value.slice(0, 10)}…`
}

export function CommentModeration({ comments, blocks }) {
  let router = useRouter()
  let [pending, setPending] = useState(null)
  let [error, setError] = useState(null)

  async function run(key, request) {
    setPending(key)
    setError(null)
    try {
      await request()
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(null)
    }
  }

  function setStatus(id, status) {
    return run(`status:${id}`, () =>
      fetchJson(`/api/studio/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    )
  }

  function block(kind, value, reason) {
    return run(`block:${value}`, () =>
      fetchJson('/api/studio/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, value, reason }),
      }),
    )
  }

  function unblock(kind, value) {
    return run(`block:${value}`, () =>
      fetchJson('/api/studio/blocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, value }),
      }),
    )
  }

  return (
    <>
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {comments.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">No comments match this filter.</li>
        )}
        {comments.map((comment) => {
          let blockKind = comment.userId ? 'user_id' : 'ip_hash'
          let blockValue = comment.userId ?? comment.ipHash
          let busy = pending === `status:${comment.id}` || pending === `block:${blockValue}`

          return (
            <li
              key={comment.id}
              className="border-2 border-zinc-900 p-4 shadow-brutal-sm dark:border-zinc-100 dark:shadow-brutal-sm-dark"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{comment.authorName}</span>
                <span className="text-xs text-zinc-500">
                  {comment.userId ?? `guest · ip ${shortHash(comment.ipHash)}`}
                </span>
                <span
                  className={clsx(
                    'border-2 px-1.5 text-[0.6875rem] font-bold uppercase leading-4',
                    STATUS_STYLES[comment.status],
                  )}
                >
                  {comment.status}
                </span>
                {comment.blocked && (
                  <span className="border-2 border-red-600 px-1.5 text-[0.6875rem] font-bold uppercase leading-4 text-red-600">
                    blocked
                  </span>
                )}
                {comment.parentId && <span className="text-xs text-zinc-500">reply to #{comment.parentId}</span>}
                <span className="ml-auto text-xs text-zinc-500">
                  #{comment.id} · {new Date(comment.createdAt).toLocaleString('en-US')}
                </span>
              </div>

              <div className="mt-1 text-xs">
                <Link
                  href={`/studio/comments?slug=${comment.slug}`}
                  className="text-zinc-500 underline hover:text-black dark:hover:text-white"
                >
                  {comment.slug}
                </Link>
                {' · '}
                <a
                  href={`/articles/${comment.slug}#comments`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 underline hover:text-black dark:hover:text-white"
                >
                  view article
                </a>
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-200">
                {comment.body.length > 500 ? `${comment.body.slice(0, 500)}…` : comment.body}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {comment.status !== 'visible' && (
                  <ActionButton disabled={busy} onClick={() => setStatus(comment.id, 'visible')}>
                    Restore
                  </ActionButton>
                )}
                {comment.status !== 'hidden' && (
                  <ActionButton disabled={busy} onClick={() => setStatus(comment.id, 'hidden')}>
                    Hide
                  </ActionButton>
                )}
                {comment.status !== 'deleted' && (
                  <ActionButton disabled={busy} onClick={() => setStatus(comment.id, 'deleted')}>
                    Delete
                  </ActionButton>
                )}
                {comment.blocked ? (
                  <ActionButton disabled={busy} onClick={() => unblock(blockKind, blockValue)}>
                    Unblock {comment.userId ? 'user' : 'IP'}
                  </ActionButton>
                ) : (
                  <ActionButton
                    disabled={busy}
                    className="border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                    onClick={() => block(blockKind, blockValue, `From comment #${comment.id} (${comment.authorName})`)}
                  >
                    Block {comment.userId ? 'user' : 'IP'}
                  </ActionButton>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <h2 className="mt-12 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">Blocked</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {blocks.length === 0 && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">Nobody is blocked.</li>
        )}
        {blocks.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-3 border-2 border-zinc-900 px-3 py-2 text-sm dark:border-zinc-100"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {entry.kind === 'user_id' ? entry.value : `ip ${shortHash(entry.value)}`}
            </span>
            {entry.reason && <span className="text-xs text-zinc-500">{entry.reason}</span>}
            <ActionButton
              className="ml-auto"
              disabled={pending === `block:${entry.value}`}
              onClick={() => unblock(entry.kind, entry.value)}
            >
              Unblock
            </ActionButton>
          </li>
        ))}
      </ul>
    </>
  )
}
