import { createHash } from 'crypto'

function getHashSecret() {
  const secret = process.env.HASH_SECRET
  if (!secret) {
    throw new Error('Missing HASH_SECRET environment variable')
  }
  return secret
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

/** Vercel sets both headers itself, so they can't be spoofed by the client. */
export function getClientIp(request) {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return '0.0.0.0'
}

/** Stable per-IP hash, used for blocks and (when enabled) rate limits. Raw IPs are never stored. */
export function hashIp(ip) {
  return sha256(`${getHashSecret()}|ip|${ip}`)
}

/** Per-day visitor hash for view dedup; includes the day so it can't be linked across days. */
export function visitorHash(ip, userAgent, day) {
  return sha256(`${getHashSecret()}|visitor|${day}|${ip}|${userAgent}`)
}

/** Current UTC date as YYYY-MM-DD. */
export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
