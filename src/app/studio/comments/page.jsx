import Link from 'next/link'

import { Button } from '@/components/Button'
import { CommentModeration } from '@/components/studio/CommentModeration'
import { MODERATION_STATUSES, listBlocks, listRecentComments } from '@/lib/moderation'

// Always read live moderation state.
export const dynamic = 'force-dynamic'

const FILTERS = [{ value: null, label: 'All' }, ...MODERATION_STATUSES.map((value) => ({ value, label: value }))]

export default async function StudioCommentsPage({ searchParams }) {
  let status = MODERATION_STATUSES.includes(searchParams?.status) ? searchParams.status : null
  let slug = typeof searchParams?.slug === 'string' && searchParams.slug ? searchParams.slug : null

  let [comments, blocks] = await Promise.all([listRecentComments({ slug, status }), listBlocks()])

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">Comments</h1>
        <Button href="/studio" variant="secondary">
          Back to Studio
        </Button>
      </div>

      <nav className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        {FILTERS.map((filter) => {
          let params = new URLSearchParams()
          if (filter.value) params.set('status', filter.value)
          if (slug) params.set('slug', slug)
          let active = filter.value === status
          return (
            <Link
              key={filter.label}
              href={`/studio/comments${params.size ? `?${params}` : ''}`}
              className={
                active
                  ? 'border-2 border-black bg-black px-2.5 py-1 capitalize text-white dark:border-white dark:bg-white dark:text-black'
                  : 'border-2 border-black px-2.5 py-1 capitalize text-zinc-700 hover:bg-highlight hover:text-black dark:border-white dark:text-zinc-300'
              }
            >
              {filter.label}
            </Link>
          )
        })}
        {slug && (
          <Link
            href={`/studio/comments${status ? `?status=${status}` : ''}`}
            className="ml-2 text-zinc-500 underline"
          >
            Clear article filter ({slug})
          </Link>
        )}
      </nav>

      <CommentModeration comments={comments} blocks={blocks} />
    </div>
  )
}
