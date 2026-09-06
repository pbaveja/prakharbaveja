import Link from 'next/link'

import { SimpleLayout } from '@/components/SimpleLayout'
import { getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

function Article({ article }) {
  return (
    <article className="border-b-2 border-black py-8 last:border-b-0 dark:border-white">
      <Link
        href={`/articles/${article.slug}`}
        className="group block transition hover:translate-x-0.5"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
          <time
            dateTime={article.date}
            className="order-2 flex-none whitespace-nowrap text-sm text-zinc-500 sm:order-1 sm:w-36 dark:text-zinc-400"
          >
            {formatDate(article.date)}
          </time>
          <div className="order-1 min-w-0 flex-auto sm:order-2">
            <h2 className="text-lg font-bold text-black dark:text-white">
              <span className="transition group-hover:bg-highlight group-hover:px-0.5 group-hover:text-black">
                {article.title}
              </span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {article.description}
            </p>
          </div>
        </div>
      </Link>
    </article>
  )
}

export const metadata = {
  title: 'Articles',
  description:
    'All of my thoughts on programming, product and everything tech, collected in chronological order.',
}

export default async function ArticlesIndex() {
  let articles = await getAllArticles()

  return (
    <SimpleLayout
      title="Writing on software, programming, tech, and product."
      intro="All of my thoughts on programming, product and everything tech, collected in chronological order."
    >
      <div className="mt-4 max-w-3xl border-t-2 border-black dark:border-white">
        {articles.map((article) => (
          <Article key={article.slug} article={article} />
        ))}
      </div>
    </SimpleLayout>
  )
}
