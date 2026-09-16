import crypto from 'node:crypto'

import { slugify } from '@/lib/articleFile'

/**
 * Builds a collision-safe repo path for an uploaded article image: content
 * is hashed rather than checked for an existing file, so it never needs to
 * ask GitHub whether the name is taken. Returns the full repo path (under
 * `public/`) plus the `/images/...` URL an article body should reference.
 */
export function buildImagePath(slug, filename, contentBase64) {
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(filename)
  const ext = extMatch ? extMatch[1].toLowerCase() : 'png'
  const base = slugify(filename.replace(/\.[^.]+$/, '')) || 'image'
  const hash = crypto.createHash('sha256').update(contentBase64).digest('hex').slice(0, 8)
  const path = `public/images/articles/${slug}/${base}-${hash}.${ext}`

  return { path, url: `/${path.slice('public/'.length)}` }
}
