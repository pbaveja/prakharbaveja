import { getAllArticles } from '@/lib/articles'
import { SITE_URL } from '@/lib/site'

// Built from the MDX source tree, which only exists at build time.
export const dynamic = 'force-static'

// Everything linked from the nav. /uses and /speaking are deliberately absent:
// they're still unedited template content. /studio, /api and /thank-you are
// disallowed in robots.js.
const STATIC_PATHS = ['/', '/articles', '/projects', '/spotify']

export default async function sitemap() {
  let articles = await getAllArticles()

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    // The publish date rather than a git mtime: Vercel builds from a shallow
    // clone, so every file there reports the same commit date.
    ...articles.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: article.date,
    })),
  ]
}
