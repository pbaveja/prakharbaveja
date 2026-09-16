import manifest from '@/generated/article-manifest.json'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Returns `{ comments }` for a published article slug, or null if there's no such article. */
export function getArticleMeta(slug) {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) return null
  return Object.hasOwn(manifest, slug) ? manifest[slug] : null
}
