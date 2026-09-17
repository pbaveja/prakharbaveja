// Writes src/generated/article-manifest.json: { [slug]: { comments } }.
//
// API routes use it as the allowlist of real article slugs (the MDX files
// aren't on disk inside Vercel functions) and to read each article's comment
// mode. It runs before `next dev` / `next build`; every Studio publish is a
// commit, so every publish redeploys and regenerates it.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import glob from 'fast-glob'

const OUTPUT = 'src/generated/article-manifest.json'
const COMMENT_MODES = new Set(['open', 'auth-only', 'off'])

// buildArticleFile writes the mode as its own JSON-quoted line inside
// `export const article = {...}`; a missing line means comments are open.
const COMMENTS_LINE = /^\s*comments:\s*["']([a-z-]+)["']\s*,?\s*$/m

const files = await glob('*/page.mdx', { cwd: 'src/app/articles' })
const manifest = {}

for (const file of files.sort()) {
  const slug = file.replace(/\/page\.mdx$/, '')
  const mode = readFileSync(`src/app/articles/${file}`, 'utf-8').match(COMMENTS_LINE)?.[1] ?? 'open'

  if (!COMMENT_MODES.has(mode)) {
    throw new Error(`Article "${slug}" has an invalid comments mode "${mode}"`)
  }
  manifest[slug] = { comments: mode }
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`article manifest: ${files.length} article(s)`)
