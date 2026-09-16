// DISABLED FOR NOW: comment rate limiting isn't needed yet. To enable it,
// uncomment this module and the `checkCommentLimits` call site in
// src/app/api/comments/[slug]/route.js.
//
// import { db } from '@/lib/db'
//
// const LIMITS = {
//   guest: { perTenMinutes: 3, perDay: 10 },
//   user: { perTenMinutes: 10, perDay: 50 },
// }
//
// /**
//  * Counts recent comments by this author (user id when signed in, IP hash
//  * for guests). Returns `{ ok: true }` or `{ ok: false, retryAfter }` in seconds.
//  */
// export async function checkCommentLimits({ userId, ipHash }) {
//   const sql = db()
//   const limits = userId ? LIMITS.user : LIMITS.guest
//
//   const [row] = userId
//     ? await sql`
//         select
//           count(*) filter (where created_at > now() - interval '10 minutes')::int as recent,
//           count(*)::int as daily
//         from comments
//         where user_id = ${userId} and created_at > now() - interval '1 day'`
//     : await sql`
//         select
//           count(*) filter (where created_at > now() - interval '10 minutes')::int as recent,
//           count(*)::int as daily
//         from comments
//         where user_id is null and ip_hash = ${ipHash} and created_at > now() - interval '1 day'`
//
//   if (row.daily >= limits.perDay) return { ok: false, retryAfter: 60 * 60 }
//   if (row.recent >= limits.perTenMinutes) return { ok: false, retryAfter: 10 * 60 }
//   return { ok: true }
// }
