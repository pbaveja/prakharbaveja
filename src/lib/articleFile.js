const ARTICLE_MARKER = 'export const article = '
const DEFAULT_EXPORT_MARKER = 'export default'

/**
 * Finds the matching closing brace for the `{` at `startIndex`, respecting
 * string boundaries so quoted values (which may themselves contain `{`/`}`)
 * don't throw off the count.
 */
function extractBalancedBraces(source, startIndex) {
  let depth = 0
  let inString = null
  let escaped = false

  for (let i = startIndex; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === inString) {
        inString = null
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char
      continue
    }

    if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) {
        return source.slice(startIndex, i + 1)
      }
    }
  }

  throw new Error('Unbalanced braces while parsing article metadata block')
}

/**
 * Parses a `src/app/articles/<slug>/page.mdx` file back into structured
 * metadata + MDX body, for the studio edit form.
 */
export function parseArticleFile(source) {
  const markerIndex = source.indexOf(ARTICLE_MARKER)
  if (markerIndex === -1) {
    throw new Error('Could not find `export const article = {...}` in this file')
  }

  const braceStart = source.indexOf('{', markerIndex)
  const objectSource = extractBalancedBraces(source, braceStart)

  // The object literal only ever contains string/primitive values written by
  // buildArticleFile below (or hand-written in the same shape), so evaluating
  // it directly is safe and far simpler than hand-rolling a JS object parser.
  // eslint-disable-next-line no-new-func
  const article = new Function(`"use strict"; return (${objectSource});`)()

  const defaultExportIndex = source.indexOf(DEFAULT_EXPORT_MARKER, markerIndex)
  if (defaultExportIndex === -1) {
    throw new Error('Could not find the `export default` line in this file')
  }
  const bodyStart = source.indexOf('\n', defaultExportIndex)
  const body = source.slice(bodyStart + 1).replace(/^\s*\n+/, '')

  return {
    author: article.author,
    date: article.date,
    title: article.title,
    description: article.description,
    body,
  }
}

/**
 * Generates a `page.mdx` file matching the site's existing article
 * convention. Metadata values are always JSON-serialized, so this can never
 * produce invalid JS no matter what characters the author typed into the
 * title/description fields.
 */
export function buildArticleFile({ title, date, description, author, body }) {
  const header = [
    "import { ArticleLayout } from '@/components/ArticleLayout'",
    '',
    'export const article = {',
    `  author: ${JSON.stringify(author || 'Prakhar Baveja')},`,
    `  date: ${JSON.stringify(date)},`,
    `  title: ${JSON.stringify(title)},`,
    `  description: ${JSON.stringify(description)},`,
    '}',
    '',
    'export const metadata = {',
    '  title: article.title,',
    '  description: article.description,',
    '}',
    '',
    'export default (props) => <ArticleLayout article={article} {...props} />',
    '',
  ].join('\n')

  return `${header}\n${String(body || '').trim()}\n`
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
