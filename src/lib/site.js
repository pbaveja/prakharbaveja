/**
 * The canonical origin, used by `metadataBase`, robots.txt and the sitemap.
 * Falls back to the production domain so a local build without an env file
 * still emits absolute URLs that point somewhere real.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prakharbaveja.com'
