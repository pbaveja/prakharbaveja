import { describe, expect, it } from 'vitest'

import {
  MAX_BODY_LENGTH,
  cleanGuestName,
  countLinks,
  isHoneypotTripped,
  validateBody,
  validateGuestName,
} from './commentValidation'

describe('validateBody', () => {
  it('rejects empty and whitespace-only bodies', () => {
    expect(validateBody('', { isGuest: false })).toMatch(/empty/)
    expect(validateBody('   \n ', { isGuest: false })).toMatch(/empty/)
    expect(validateBody(undefined, { isGuest: false })).toMatch(/empty/)
  })

  it('enforces the length limit on the trimmed body', () => {
    expect(validateBody('a'.repeat(MAX_BODY_LENGTH), { isGuest: false })).toBeNull()
    expect(validateBody(`  ${'a'.repeat(MAX_BODY_LENGTH)}  `, { isGuest: false })).toBeNull()
    expect(validateBody('a'.repeat(MAX_BODY_LENGTH + 1), { isGuest: false })).toMatch(/2000/)
  })

  it('caps links for guests only', () => {
    let body = 'see https://a.com and http://b.com and www.c.com'
    expect(countLinks(body)).toBe(3)
    expect(validateBody(body, { isGuest: true })).toMatch(/at most 2 links/)
    expect(validateBody(body, { isGuest: false })).toBeNull()
    expect(validateBody('https://a.com https://b.com', { isGuest: true })).toBeNull()
  })

  it('gives the same answer on repeated calls', () => {
    let body = 'https://a.com https://b.com https://c.com'
    expect(validateBody(body, { isGuest: true })).toMatch(/links/)
    expect(validateBody(body, { isGuest: true })).toMatch(/links/)
  })
})

describe('validateGuestName', () => {
  it('accepts normal names', () => {
    expect(validateGuestName('Ada Lovelace')).toBeNull()
    expect(validateGuestName('Jo')).toBeNull()
  })

  it('enforces length bounds', () => {
    expect(validateGuestName('J')).toMatch(/between/)
    expect(validateGuestName('x'.repeat(41))).toMatch(/between/)
    expect(validateGuestName(undefined)).toMatch(/name/)
  })

  it.each(['Prakhar', 'prakhar  BAVEJA', ' Admin ', 'author', 'PBaveja', 'moderator'])(
    'rejects reserved name %j',
    (name) => {
      expect(validateGuestName(name)).toMatch(/reserved/)
    },
  )

  it('allows names that only contain a reserved word', () => {
    expect(validateGuestName('Prakhar Fan')).toBeNull()
  })

  it('rejects links in names', () => {
    expect(validateGuestName('buy at https://spam.io')).toMatch(/link/)
    expect(validateGuestName('cheap-pills.com')).toMatch(/link/)
    expect(validateGuestName('www.spam')).toMatch(/link/)
  })

  it('collapses whitespace when cleaning', () => {
    expect(cleanGuestName('  Ada   Lovelace ')).toBe('Ada Lovelace')
  })
})

describe('isHoneypotTripped', () => {
  it('only trips on a non-empty value', () => {
    expect(isHoneypotTripped('')).toBe(false)
    expect(isHoneypotTripped(undefined)).toBe(false)
    expect(isHoneypotTripped('   ')).toBe(false)
    expect(isHoneypotTripped('http://spam')).toBe(true)
  })
})
