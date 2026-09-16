import { db } from '@/lib/db'
import { isAdminUserId, providerOf } from '@/lib/viewer'

/**
 * Exact number of comments shown publicly per slug: visible comments whose
 * thread root isn't hidden. Deleted placeholders don't count.
 */
export async function getCommentCounts(slugs) {
  if (!slugs.length) return {}

  const rows = await db()`
    select c.slug, count(*)::int as count
    from comments c
    left join comments p on p.id = c.parent_id
    where c.slug = any(${slugs})
      and c.status = 'visible'
      and (p.id is null or p.status <> 'hidden')
    group by c.slug`

  return Object.fromEntries(rows.map((row) => [row.slug, row.count]))
}

export async function getViewCounts(slugs) {
  if (!slugs.length) return {}

  const rows = await db()`
    select slug, views::text as views from article_views where slug = any(${slugs})`

  // bigint comes back as a string; view counts stay far below 2^53.
  return Object.fromEntries(rows.map((row) => [row.slug, Number(row.views)]))
}

/** Public JSON shape of a comment. Never exposes ip_hash or user_id. */
export function serializeComment(row, viewerId) {
  const base = {
    id: String(row.id),
    parentId: row.parent_id ? String(row.parent_id) : null,
    createdAt: new Date(row.created_at).toISOString(),
  }

  if (row.status === 'deleted') {
    return { ...base, deleted: true }
  }

  return {
    ...base,
    deleted: false,
    authorName: row.author_name,
    authorImage: row.author_image,
    provider: providerOf(row.user_id),
    isGuest: !row.user_id,
    isAdmin: isAdminUserId(row.user_id),
    isMine: Boolean(viewerId) && row.user_id === viewerId,
    body: row.body,
  }
}

/** Threads for one article: top-level comments (oldest first), each with its replies. */
export async function listComments(slug, viewerId) {
  const rows = await db()`
    select id, parent_id, user_id, author_name, author_image, body, status, created_at
    from comments
    where slug = ${slug} and status <> 'hidden'
    order by created_at asc, id asc`

  const threads = []
  const byId = new Map()

  for (const row of rows) {
    if (row.parent_id) continue
    const comment = { ...serializeComment(row, viewerId), replies: [] }
    byId.set(comment.id, comment)
    threads.push(comment)
  }

  for (const row of rows) {
    if (!row.parent_id) continue
    // A missing parent means the parent is hidden, which hides its thread.
    byId.get(String(row.parent_id))?.replies.push(serializeComment(row, viewerId))
  }

  // Deleted comments only stay as placeholders to keep their replies readable.
  return threads
    .map((thread) => ({ ...thread, replies: thread.replies.filter((reply) => !reply.deleted) }))
    .filter((thread) => !thread.deleted || thread.replies.length > 0)
}

export async function isBlocked({ ipHash, userId }) {
  const rows = await db()`
    select 1 from blocks
    where (kind = 'ip_hash' and value = ${ipHash})
       or (kind = 'user_id' and value = ${userId ?? ''})
    limit 1`
  return rows.length > 0
}

/**
 * Resolves the thread root for a reply. Replies to replies attach to the
 * top-level comment, keeping threads one level deep. Returns null if the
 * parent can't be replied to.
 */
export async function resolveParentId(slug, parentId) {
  if (!/^\d{1,18}$/.test(String(parentId))) return null

  const [parent] = await db()`
    select p.id, p.parent_id, p.status, p.slug, r.status as root_status
    from comments p
    left join comments r on r.id = p.parent_id
    where p.id = ${parentId}`

  if (!parent || parent.slug !== slug || parent.status !== 'visible') return null
  if (parent.parent_id && parent.root_status === 'hidden') return null

  return String(parent.parent_id ?? parent.id)
}

export async function isDuplicate({ slug, body, userId, ipHash }) {
  const rows = userId
    ? await db()`
        select 1 from comments
        where slug = ${slug} and user_id = ${userId} and body = ${body}
          and status <> 'deleted' and created_at > now() - interval '1 hour'
        limit 1`
    : await db()`
        select 1 from comments
        where slug = ${slug} and user_id is null and ip_hash = ${ipHash} and body = ${body}
          and status <> 'deleted' and created_at > now() - interval '1 hour'
        limit 1`
  return rows.length > 0
}

export async function insertComment({ slug, parentId, userId, authorName, authorImage, body, ipHash }) {
  const [row] = await db()`
    insert into comments (slug, parent_id, user_id, author_name, author_image, body, ip_hash)
    values (${slug}, ${parentId}, ${userId}, ${authorName}, ${authorImage}, ${body}, ${ipHash})
    returning id, parent_id, user_id, author_name, author_image, body, status, created_at`
  return row
}

/** Soft-deletes a comment owned by `userId`. Returns false if it isn't theirs. */
export async function deleteOwnComment({ id, slug, userId }) {
  if (!/^\d{1,18}$/.test(String(id))) return false

  const rows = await db()`
    update comments set status = 'deleted'
    where id = ${id} and slug = ${slug} and user_id = ${userId} and status = 'visible'
    returning id`
  return rows.length > 0
}
