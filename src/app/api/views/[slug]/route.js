import { isbot } from 'isbot'
import { NextResponse } from 'next/server'

import { getArticleMeta } from '@/lib/articleManifest'
import { getCommentCounts } from '@/lib/comments'
import { db } from '@/lib/db'
import { getClientIp, utcDay, visitorHash } from '@/lib/requestIdentity'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

async function shouldCount(request) {
  const userAgent = request.headers.get('user-agent') || ''
  if (!userAgent || isbot(userAgent)) return false

  // Don't count the author's own visits while logged in to Studio.
  const studioToken = request.cookies.get(SESSION_COOKIE)?.value
  if (studioToken && (await verifySessionToken(studioToken).catch(() => false))) return false

  return true
}

/** Records a view (once per visitor per UTC day) and returns the article's current counts. */
export async function POST(request, { params }) {
  const { slug } = params
  const meta = getArticleMeta(slug)
  if (!meta) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE })
  }

  try {
    const sql = db()
    let views

    if (await shouldCount(request)) {
      const day = utcDay()
      const hash = visitorHash(getClientIp(request), request.headers.get('user-agent'), day)

      // One atomic statement: only a first-seen (slug, visitor, day) row adds 1.
      const [row] = await sql`
        with inserted as (
          insert into view_dedup (slug, visitor_hash, day)
          values (${slug}, ${hash}, ${day})
          on conflict do nothing
          returning 1
        )
        insert into article_views (slug, views)
        select ${slug}, count(*) from inserted
        on conflict (slug) do update set views = article_views.views + excluded.views
        returning views::text as views`
      views = Number(row.views)
    } else {
      const [row] = await sql`select views::text as views from article_views where slug = ${slug}`
      views = Number(row?.views ?? 0)
    }

    // null = comments are turned off for this article
    const comments = meta.comments === 'off' ? null : ((await getCommentCounts([slug]))[slug] ?? 0)

    return NextResponse.json({ views, comments }, { headers: NO_STORE })
  } catch (error) {
    console.error(`Failed to record view for "${slug}"`, error)
    return NextResponse.json({ error: 'Could not record view' }, { status: 500, headers: NO_STORE })
  }
}
