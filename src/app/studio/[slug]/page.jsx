import { notFound } from 'next/navigation'

import { ArticleEditor } from '@/components/studio/ArticleEditor'
import { parseArticleFile } from '@/lib/articleFile'
import { getArticleFile } from '@/lib/github'

export const dynamic = 'force-dynamic'

export default async function EditArticlePage({ params }) {
  let file = await getArticleFile(params.slug)
  if (!file) notFound()

  let parsed = parseArticleFile(file.content)

  return (
    <ArticleEditor
      mode="edit"
      slug={params.slug}
      sha={file.sha}
      initialValues={{
        title: parsed.title,
        date: parsed.date,
        description: parsed.description,
        body: parsed.body,
      }}
    />
  )
}
