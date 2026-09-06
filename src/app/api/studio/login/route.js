import { timingSafeEqual } from 'crypto'

import { NextResponse } from 'next/server'

import { createSessionToken, SESSION_COOKIE } from '@/lib/session'

function safeCompare(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request) {
  const expected = process.env.STUDIO_PASSWORD
  if (!expected) {
    return NextResponse.json(
      { error: 'Studio is not configured (missing STUDIO_PASSWORD)' },
      { status: 500 },
    )
  }

  const { password } = await request.json().catch(() => ({}))

  if (typeof password !== 'string' || !safeCompare(password, expected)) {
    return NextResponse.json({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const token = await createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
