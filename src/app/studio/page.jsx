import Link from 'next/link'

import { Button } from '@/components/Button'
import { LogoutButton } from '@/components/studio/LogoutButton'
import { parseArticleFile } from '@/lib/articleFile'
import { formatDate } from '@/lib/formatDate'
import { getArticleFile, listArticleSlugs } from '@/lib/github'

// Always read the live repo state from GitHub, never a cached/prerendered
// build — otherwise this list could go stale right after a publish.
export const dynamic = 'force-dynamic'

async function getArticles() {
  let slugs = await listArticleSlugs()

  let articles = await Promise.all(
    slugs.map(async (slug) => {
      let file = await getArticleFile(slug)
      if (!file) return null

      try {
        let { title, date, description } = parseArticleFile(file.content)
        return { slug, title, date, description }
      } catch {
        return { slug, title: slug, date: null, description: 'Could not parse metadata' }
      }
    }),
  )

  return articles
    .filter(Boolean)
    .sort((a, z) => new Date(z.date ?? 0) - new Date(a.date ?? 0))
}

export default async function StudioDashboard() {
  let articles = await getArticles()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Studio
        </h1>
        <div className="flex gap-3">
          <Button href="/studio/new">New article</Button>
          <LogoutButton />
        </div>
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {articles.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No articles found.
          </p>
        )}
        {articles.map((article) => (
          <li
            key={article.slug}
            className="rounded-md border-2 border-zinc-900 p-4 shadow-brutal-sm dark:border-zinc-100 dark:shadow-brutal-sm-dark"
          >
            <Link
              href={`/studio/${article.slug}`}
              className="font-semibold text-zinc-900 hover:text-blue-500 dark:text-zinc-100 dark:hover:text-blue-400"
            >
              {article.title}
            </Link>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {article.date ? formatDate(article.date) : 'Unknown date'} —{' '}
              {article.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
