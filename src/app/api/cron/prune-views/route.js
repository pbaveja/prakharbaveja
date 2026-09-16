import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Called daily by Vercel Cron (vercel.json). Dedup rows are only needed for
// the current UTC day, so anything older than yesterday can go.
export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db()`
    delete from view_dedup where day < current_date - 1 returning 1`

  return NextResponse.json({ deleted: rows.length })
}
