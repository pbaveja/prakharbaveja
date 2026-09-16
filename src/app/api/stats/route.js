import { NextResponse } from 'next/server'

import { getArticleMeta } from '@/lib/articleManifest'
import { getCommentCounts, getViewCounts } from '@/lib/comments'

export const dynamic = 'force-dynamic'

const MAX_SLUGS = 50
const NO_STORE = { 'Cache-Control': 'no-store' }

/** GET /api/stats?slugs=a,b,c → { [slug]: { views, comments } }, comments is null when turned off */
export async function GET(request) {
  const requested = (request.nextUrl.searchParams.get('slugs') || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)

  if (requested.length > MAX_SLUGS) {
    return NextResponse.json(
      { error: `At most ${MAX_SLUGS} slugs per request` },
      { status: 400, headers: NO_STORE },
    )
  }

  const slugs = [...new Set(requested)].filter((slug) => getArticleMeta(slug))

  try {
    const [views, comments] = await Promise.all([getViewCounts(slugs), getCommentCounts(slugs)])

    const stats = Object.fromEntries(
      slugs.map((slug) => [
        slug,
        {
          views: views[slug] ?? 0,
          // null = comments are turned off for this article
          comments: getArticleMeta(slug).comments === 'off' ? null : (comments[slug] ?? 0),
        },
      ]),
    )

    return NextResponse.json(stats, { headers: NO_STORE })
  } catch (error) {
    console.error('Failed to load article stats', error)
    return NextResponse.json({ error: 'Could not load stats' }, { status: 500, headers: NO_STORE })
  }
}
