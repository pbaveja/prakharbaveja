import { db } from '@/lib/db'

export const MODERATION_STATUSES = ['visible', 'hidden', 'deleted']
export const BLOCK_KINDS = ['ip_hash', 'user_id']

/** Recent comments across all articles for the Studio moderation page. */
export async function listRecentComments({ slug = null, status = null, limit = 100 } = {}) {
  const rows = await db()`
    select c.id, c.slug, c.parent_id, c.user_id, c.author_name, c.body, c.status, c.ip_hash, c.created_at,
      exists (
        select 1 from blocks b
        where (b.kind = 'ip_hash' and b.value = c.ip_hash)
           or (b.kind = 'user_id' and b.value = c.user_id)
      ) as blocked
    from comments c
    where (${slug}::text is null or c.slug = ${slug})
      and (${status}::text is null or c.status = ${status})
    order by c.created_at desc, c.id desc
    limit ${limit}`

  return rows.map((row) => ({
    id: String(row.id),
    slug: row.slug,
    parentId: row.parent_id ? String(row.parent_id) : null,
    userId: row.user_id,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    ipHash: row.ip_hash,
    blocked: row.blocked,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function setCommentStatus(id, status) {
  const rows = await db()`
    update comments set status = ${status} where id = ${id} returning id`
  return rows.length > 0
}

export async function listBlocks() {
  const rows = await db()`
    select id, kind, value, reason, created_at from blocks order by created_at desc`
  return rows.map((row) => ({
    id: String(row.id),
    kind: row.kind,
    value: row.value,
    reason: row.reason,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function addBlock({ kind, value, reason }) {
  await db()`
    insert into blocks (kind, value, reason)
    values (${kind}, ${value}, ${reason ?? null})
    on conflict (kind, value) do update set reason = excluded.reason`
}

export async function removeBlock({ kind, value }) {
  await db()`delete from blocks where kind = ${kind} and value = ${value}`
}
