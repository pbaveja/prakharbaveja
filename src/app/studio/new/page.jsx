import { ArticleEditor } from '@/components/studio/ArticleEditor'

export default function NewArticlePage() {
  return (
    <ArticleEditor
      mode="new"
      initialValues={{
        title: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        comments: 'open',
        body: '## Heading\n\nStart writing…\n',
      }}
    />
  )
}
