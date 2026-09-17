'use client'

import { useEffect } from 'react'
import useSWR from 'swr'

import { CommentForm, SignInButtons, ViewerBar } from '@/components/comments/CommentForm'
import { CommentItem } from '@/components/comments/CommentItem'
import { fetchJson } from '@/lib/fetchJson'
import { formatExact } from '@/lib/formatCount'

/** Same rule as the server's count: every non-deleted comment that's rendered. */
function countVisible(threads) {
  return threads.reduce(
    (total, thread) =>
      total + (thread.deleted ? 0 : 1) + thread.replies.filter((reply) => !reply.deleted).length,
    0,
  )
}

function addComment(threads, comment) {
  if (!comment.parentId) {
    return [...threads, comment]
  }
  return threads.map((thread) =>
    thread.id === comment.parentId
      ? { ...thread, replies: [...thread.replies, { ...comment, replies: undefined }] }
      : thread,
  )
}

function Panel({ children }) {
  return (
    <div className="border-2 border-black bg-white p-4 shadow-brutal-sm sm:p-6 dark:border-white dark:bg-zinc-900 dark:shadow-brutal-sm-dark">
      {children}
    </div>
  )
}

export function Comments({ slug, mode, onCountChange }) {
  let key = `/api/comments/${encodeURIComponent(slug)}`
  let { data, error, isLoading, mutate } = useSWR(key, fetchJson, { revalidateOnFocus: false })

  let threads = data?.comments ?? []
  let viewer = data?.viewer ?? null
  let count = data ? countVisible(threads) : null

  // Keep the header's comment count in lockstep with what's rendered here.
  useEffect(() => {
    if (count !== null) onCountChange?.(count)
  }, [count, onCountChange])

  function handlePosted(comment) {
    mutate((current) => current && { ...current, comments: addComment(current.comments, comment) }, {
      revalidate: false,
    })
  }

  async function handleDelete(id) {
    await fetchJson(`${key}/${id}`, { method: 'DELETE' })
    await mutate()
  }

  let canWrite = viewer || mode === 'open'

  return (
    <section id="comments" aria-labelledby="comments-heading" className="mt-16 scroll-mt-24">
      <h2
        id="comments-heading"
        className="flex items-baseline gap-2 text-2xl font-extrabold tracking-tight text-black dark:text-white"
      >
        Comments
        {count !== null && (
          <span className="text-base font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
            ({formatExact(count)})
          </span>
        )}
      </h2>

      <div className="mt-6">
        <Panel>
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Comments could not be loaded right now.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {viewer ? (
                <ViewerBar viewer={viewer} onSignedOut={() => mutate()} />
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {mode === 'auth-only'
                      ? 'Sign in to join the conversation on this article.'
                      : 'Sign in to comment with your account, or post as a guest below.'}
                  </p>
                  <SignInButtons />
                </div>
              )}
              {canWrite && <CommentForm slug={slug} viewer={viewer} onPosted={handlePosted} />}
            </div>
          )}
        </Panel>
      </div>

      {data && (
        <ol className="mt-8 flex flex-col">
          {threads.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              No comments yet. Be the first to share your thoughts.
            </li>
          )}
          {threads.map((thread) => (
            <li
              key={thread.id}
              className="border-b-2 border-black py-5 first:pt-0 last:border-b-0 dark:border-white"
            >
              <CommentItem
                comment={thread}
                slug={slug}
                viewer={viewer}
                canReply={Boolean(canWrite)}
                onPosted={handlePosted}
                onDelete={handleDelete}
              />
              {thread.replies.length > 0 && (
                <ol className="ml-4 mt-4 flex flex-col gap-4 border-l-2 border-black pl-4 sm:ml-11 dark:border-white">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentItem
                        comment={reply}
                        slug={slug}
                        viewer={viewer}
                        canReply={false}
                        onPosted={handlePosted}
                        onDelete={handleDelete}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
