import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getClientIp, hashIp, utcDay, visitorHash } from './requestIdentity'

function requestWith(headers) {
  return { headers: new Headers(headers) }
}

describe('requestIdentity', () => {
  let originalSecret

  beforeEach(() => {
    originalSecret = process.env.HASH_SECRET
    process.env.HASH_SECRET = 'test-secret'
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.HASH_SECRET
    else process.env.HASH_SECRET = originalSecret
  })

  it('hashes IPs deterministically without exposing them', () => {
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'))
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('1.2.3.5'))
    expect(hashIp('1.2.3.4')).not.toContain('1.2.3.4')
    expect(hashIp('1.2.3.4')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('changes the visitor hash when the day, ip or user agent changes', () => {
    let base = visitorHash('1.2.3.4', 'UA', '2026-09-17')
    expect(visitorHash('1.2.3.4', 'UA', '2026-09-17')).toBe(base)
    expect(visitorHash('1.2.3.4', 'UA', '2026-09-18')).not.toBe(base)
    expect(visitorHash('1.2.3.5', 'UA', '2026-09-17')).not.toBe(base)
    expect(visitorHash('1.2.3.4', 'UA2', '2026-09-17')).not.toBe(base)
  })

  it('depends on the secret', () => {
    let before = hashIp('1.2.3.4')
    process.env.HASH_SECRET = 'other-secret'
    expect(hashIp('1.2.3.4')).not.toBe(before)
  })

  it('throws when the secret is missing', () => {
    delete process.env.HASH_SECRET
    expect(() => hashIp('1.2.3.4')).toThrow(/HASH_SECRET/)
  })

  it('reads the client ip from Vercel headers', () => {
    expect(getClientIp(requestWith({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1' }))).toBe('9.9.9.9')
    expect(getClientIp(requestWith({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('1.1.1.1')
    expect(getClientIp(requestWith({}))).toBe('0.0.0.0')
  })

  it('formats the UTC day', () => {
    expect(utcDay(new Date('2026-09-17T23:59:59Z'))).toBe('2026-09-17')
  })
})
