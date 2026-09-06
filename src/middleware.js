import { NextResponse } from 'next/server'

import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export const config = {
  matcher: ['/studio/:path*', '/api/studio/:path*'],
}

const PUBLIC_PATHS = new Set(['/studio/login', '/api/studio/login', '/api/studio/logout'])

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const authed = await verifySessionToken(token)

  if (authed) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/studio/login', request.url)
  return NextResponse.redirect(loginUrl)
}
