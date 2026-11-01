/**
 * Builds the full metadata object for an article page, so OG and Twitter tags
 * stay in one place instead of being copy-pasted into every MDX file.
 * `buildArticleFile` emits a call to this, so new Studio publishes get it too.
 *
 * The slug is passed explicitly: ArticleLayout derives it from `usePathname()`
 * at render time, which isn't available in a `metadata` export.
 */
export function articleMetadata(article, slug) {
  let path = `/articles/${slug}`
  let image = {
    url: `/og${path}`,
    width: 1200,
    height: 630,
    alt: article.title,
  }

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      authors: [article.author],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [image],
    },
  }
}
