import rehypePrism from '@mapbox/rehype-prism'
import { compile, evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import * as runtime from 'react/jsx-runtime'

const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypePrism],
}

/**
 * Dry-run compiles a full generated article file (header exports + MDX body)
 * through the exact same remark/rehype pipeline used at build time
 * (next.config.mjs), without writing or committing anything. This is what
 * catches MDX/JSX syntax errors (a stray `<` or `{}` in prose, say) before
 * they ever reach GitHub or a Vercel build.
 */
export async function validateArticleSource(fileSource) {
  try {
    await compile(fileSource, { ...mdxOptions, outputFormat: 'program' })
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      message: error.message,
      line: error.line ?? error.position?.start?.line ?? null,
      column: error.column ?? error.position?.start?.column ?? null,
    }
  }
}

/**
 * Renders just the MDX body (no header/ArticleLayout import, since those
 * only resolve once bundled) to a static HTML string for the studio preview
 * pane, using the same plugins so code blocks/tables look like production.
 */
export async function renderMdxPreview(body) {
  const { default: Content } = await evaluate(body, { ...runtime, ...mdxOptions })
  const { renderToStaticMarkup } = await import('react-dom/server')
  return renderToStaticMarkup(Content({}))
}
