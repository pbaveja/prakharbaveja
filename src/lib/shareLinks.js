import { SITE_URL } from '@/lib/site'

/**
 * Share-intent URLs for an article.
 *
 * These are built from the slug rather than from `window.location`, for the
 * same reason the feed rewrites its links: the URL ends up on someone else's
 * site, where a localhost origin or a stray `?ref=` query would be wrong or
 * would split the canonical URL. Kept out of the component so the query
 * building is testable without a DOM.
 */
export function articleShareUrl(slug) {
  return `${SITE_URL}/articles/${slug}`
}

/** URLSearchParams form-encodes spaces as `+`, which is right for a query. */
function query(params) {
  return new URLSearchParams(params).toString()
}

export function xShareUrl({ url, title }) {
  return `https://x.com/intent/post?${query({ text: title, url })}`
}

/**
 * LinkedIn's share endpoint takes the URL alone — it pulls the title and image
 * from the page's own Open Graph tags.
 */
export function linkedInShareUrl({ url }) {
  return `https://www.linkedin.com/sharing/share-offsite/?${query({ url })}`
}
