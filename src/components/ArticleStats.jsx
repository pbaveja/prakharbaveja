'use client'

import { createContext, useContext } from 'react'
import clsx from 'clsx'
import useSWR from 'swr'

import { fetchJson } from '@/lib/fetchJson'
import { formatCount, formatExact, pluralize } from '@/lib/formatCount'

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
}

const StatsContext = createContext(null)

/** Loads counts for every article in a list with a single request. */
export function ArticleStatsProvider({ slugs, children }) {
  let key = slugs.length ? `/api/stats?slugs=${slugs.map(encodeURIComponent).join(',')}` : null
  let { data, error } = useSWR(key, fetchJson, SWR_OPTIONS)

  return (
    <StatsContext.Provider value={{ data, error }}>{children}</StatsContext.Provider>
  )
}

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1.75 8S4 3.75 8 3.75 14.25 8 14.25 8 12 12.25 8 12.25 1.75 8 1.75 8Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.75" strokeWidth="1.5" />
    </svg>
  )
}

function CommentIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.75 3.75a1 1 0 0 1 1-1h8.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5v-2.5h-.25a1 1 0 0 1-1-1v-6Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Stat({ icon: Icon, count, noun }) {
  let loading = count === undefined
  let label = loading ? `Loading ${noun}s` : `${formatExact(count)} ${pluralize(count, noun)}`

  return (
    <span className="inline-flex items-center gap-1" title={loading ? undefined : label}>
      <Icon className="h-4 w-4 flex-none stroke-current" />
      <span aria-hidden="true" className="min-w-[2ch] tabular-nums">
        {loading ? '—' : formatCount(count)}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

/**
 * "👁 1.2K  💬 14". Pass `stats` directly, or `slug` to read it from the
 * surrounding ArticleStatsProvider. Renders nothing if the counts failed to load.
 * `showComments` is known up front (article metadata), so the placeholder
 * never appears and then disappears for articles with comments turned off.
 */
export function ArticleStats({ slug, stats, showComments = true, className }) {
  let list = useContext(StatsContext)
  if (stats === undefined && list) {
    if (list.error) return null
    stats = list.data?.[slug]
  }
  if (stats === null) return null

  return (
    // Font size and color are inherited so the stats match the date beside them.
    <span className={clsx('inline-flex items-center gap-3', className)}>
      <Stat icon={EyeIcon} count={stats?.views} noun="view" />
      {showComments && stats?.comments !== null && (
        <Stat icon={CommentIcon} count={stats?.comments} noun="comment" />
      )}
    </span>
  )
}

/**
 * Records this visit and returns the article's counts. The long dedupe window
 * means client-side navigation back to the article doesn't POST again (the
 * server only counts one view per visitor per day either way).
 */
export function useArticlePageStats(slug) {
  let { data, error } = useSWR(
    slug ? `article-stats:${slug}` : null,
    () => fetchJson(`/api/views/${encodeURIComponent(slug)}`, { method: 'POST' }),
    { ...SWR_OPTIONS, revalidateIfStale: false, dedupingInterval: 60 * 60 * 1000 },
  )
  return error ? null : data
}
