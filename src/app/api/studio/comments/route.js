import { NextResponse } from 'next/server'

import { MODERATION_STATUSES, listRecentComments } from '@/lib/moderation'

export const dynamic = 'force-dynamic'

// Protected by src/middleware.js (matches /api/studio/*).
export async function GET(request) {
  const params = request.nextUrl.searchParams
  const slug = params.get('slug') || null
  const status = params.get('status') || null

  if (status && !MODERATION_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const comments = await listRecentComments({ slug, status })
  return NextResponse.json({ comments })
}
