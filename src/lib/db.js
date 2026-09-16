import { neon, neonConfig } from '@neondatabase/serverless'

// Local development only: point the HTTP driver at a local Neon-compatible
// proxy (e.g. ghcr.io/timowilhelm/local-neon-http-proxy) instead of Neon.
if (process.env.NEON_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT
}

let client

/**
 * Neon HTTP client, created lazily so importing this module never fails at
 * build time when DATABASE_URL isn't set.
 */
export function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing DATABASE_URL environment variable')
    }
    // The driver queries over fetch(), which Next.js would otherwise store in
    // its Data Cache — serving stale counts and comments. Never cache queries.
    client = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
  }
  return client
}
