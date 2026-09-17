import { NextResponse } from 'next/server'

import { MODERATION_STATUSES, setCommentStatus } from '@/lib/moderation'

// Protected by src/middleware.js (matches /api/studio/*).
export async function PATCH(request, { params }) {
  const { status } = await request.json().catch(() => ({}))

  if (!/^\d{1,18}$/.test(params.id) || !MODERATION_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid comment id or status' }, { status: 400 })
  }

  const updated = await setCommentStatus(params.id, status)
  if (!updated) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
