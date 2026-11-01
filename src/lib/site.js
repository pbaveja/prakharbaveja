/**
 * The canonical origin, used by `metadataBase`, robots.txt and the sitemap.
 * Falls back to the production domain so a local build without an env file
 * still emits absolute URLs that point somewhere real.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prakharbaveja.com'

/** Default meta description, also used by the homepage's WebSite JSON-LD. */
export const SITE_DESCRIPTION =
  'I write about the software I build, the bugs that humble me, and what I learn along the way — side projects, stray technical obsessions, and the occasional detour.'
