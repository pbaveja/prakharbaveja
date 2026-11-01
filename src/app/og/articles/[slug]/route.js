import glob from 'fast-glob'
import { ImageResponse } from 'next/og'

import { getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'
import { Card, SIZE, loadFonts, plateForSlug } from '@/lib/og/card'

// Prerendered at build time: the MDX files aren't on disk inside Vercel
// functions, so the article list has to be read while the repo still is.
export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  let files = await glob('*/page.mdx', { cwd: './src/app/articles' })

  return files.map((file) => ({ slug: file.replace(/\/page\.mdx$/, '') }))
}

export async function GET(request, { params }) {
  let articles = await getAllArticles()
  let article = articles.find((candidate) => candidate.slug === params.slug)

  if (!article) {
    return new Response('Not found', { status: 404 })
  }

  return new ImageResponse(
    (
      <Card
        title={article.title}
        eyebrow="prakharbaveja.com/articles"
        footer={formatDate(article.date)}
        plate={plateForSlug(params.slug)}
      />
    ),
    { ...SIZE, fonts: await loadFonts() },
  )
}
