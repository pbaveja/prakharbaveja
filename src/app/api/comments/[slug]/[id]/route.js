import { NextResponse } from 'next/server'

import { getArticleMeta } from '@/lib/articleManifest'
import { deleteOwnComment } from '@/lib/comments'
import { getViewer } from '@/lib/viewer'

export const dynamic = 'force-dynamic'

/** Signed-in authors can soft-delete their own comments. */
export async function DELETE(request, { params }) {
  if (!getArticleMeta(params.slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const viewer = await getViewer()
  if (!viewer) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  try {
    const deleted = await deleteOwnComment({ id: params.id, slug: params.slug, userId: viewer.id })
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Failed to delete comment ${params.id}`, error)
    return NextResponse.json({ error: 'Could not delete the comment.' }, { status: 500 })
  }
}
