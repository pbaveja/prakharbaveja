import rehypePrism from '@mapbox/rehype-prism'
import { compile, evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import * as runtime from 'react/jsx-runtime'

import { DiagramSvg } from '@/components/DiagramSvg'

// Mirrors mdx-components.jsx's registration, with two differences:
// - Diagram: this renders the plain, non-interactive DiagramSvg rather than
//   the 'use client' Diagram component. Importing a 'use client' module into
//   this file (reached via a Route Handler under src/app) resolves to an
//   inert client-reference marker object rather than the real component, so
//   calling it directly via react-dom/server throws "Element type is
//   invalid ... but got: object". A static preview can't hydrate click
//   interactivity anyway, so this is a fine substitute.
// - Image: next/image needs Next's own image-optimization request context,
//   which this bare react-dom/server render doesn't have, so a plain <img>
//   stands in for it (only matters if an article hand-writes literal <Image>
//   JSX — Feature 1 never emits that tag).
const previewComponents = {
  Diagram: (props) => (
    <div className="not-prose my-6">
      <DiagramSvg nodes={props.data?.nodes || []} edges={props.data?.edges || []} />
    </div>
  ),
  // eslint-disable-next-line @next/next/no-img-element
  Image: (props) => <img {...props} alt={props.alt || ''} />,
}

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
  return renderToStaticMarkup(Content({ components: previewComponents }))
}
