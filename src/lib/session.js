import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'studio_session'
const SESSION_DURATION = '7d'

function getSecretKey() {
  const secret = process.env.STUDIO_SESSION_SECRET
  if (!secret) {
    throw new Error('Missing STUDIO_SESSION_SECRET environment variable')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken() {
  return new SignJWT({ studio: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey())
}

export async function verifySessionToken(token) {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload.studio === true
  } catch {
    return false
  }
}
