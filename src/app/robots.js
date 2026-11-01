import { SITE_URL } from '@/lib/site'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /studio is the private editor (the middleware already gates it),
      // /api serves JSON, and /thank-you is a post-subscribe dead end.
      disallow: ['/studio', '/api', '/thank-you'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
