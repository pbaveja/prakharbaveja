import { NextResponse } from 'next/server'

import { getArticleMeta } from '@/lib/articleManifest'
import {
  cleanGuestName,
  isHoneypotTripped,
  validateBody,
  validateGuestName,
} from '@/lib/commentValidation'
import {
  insertComment,
  isBlocked,
  isDuplicate,
  listComments,
  resolveParentId,
  serializeComment,
} from '@/lib/comments'
// import { checkCommentLimits } from '@/lib/rateLimit' // DISABLED FOR NOW, see src/lib/rateLimit.js
import { getClientIp, hashIp } from '@/lib/requestIdentity'
import { getViewer } from '@/lib/viewer'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

function json(body, status = 200, headers = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } })
}

export async function GET(request, { params }) {
  const meta = getArticleMeta(params.slug)
  if (!meta || meta.comments === 'off') {
    return json({ error: 'Not found' }, 404)
  }

  try {
    const viewer = await getViewer()
    const comments = await listComments(params.slug, viewer?.id)
    return json({ mode: meta.comments, viewer, comments })
  } catch (error) {
    console.error(`Failed to load comments for "${params.slug}"`, error)
    return json({ error: 'Could not load comments' }, 500)
  }
}

export async function POST(request, { params }) {
  const { slug } = params
  const meta = getArticleMeta(slug)
  if (!meta) {
    return json({ error: 'Not found' }, 404)
  }
  if (meta.comments === 'off') {
    return json({ error: 'Comments are closed on this article.' }, 403)
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return json({ error: 'Invalid request body' }, 400)
  }

  try {
    const viewer = await getViewer()
    if (!viewer && meta.comments === 'auth-only') {
      return json({ error: 'Please sign in to comment on this article.' }, 401)
    }

    // Pretend success so bots don't learn about the honeypot.
    if (isHoneypotTripped(payload.website)) {
      return json({ comment: null })
    }

    const isGuest = !viewer
    const body = typeof payload.body === 'string' ? payload.body.trim() : ''
    const bodyError = validateBody(body, { isGuest })
    if (bodyError) return json({ error: bodyError }, 400)

    let authorName = viewer?.name
    if (isGuest) {
      const nameError = validateGuestName(payload.name)
      if (nameError) return json({ error: nameError }, 400)
      authorName = cleanGuestName(payload.name)
    }

    const ipHash = hashIp(getClientIp(request))
    const userId = viewer?.id ?? null

    if (await isBlocked({ ipHash, userId })) {
      return json({ error: 'You are not allowed to comment here.' }, 403)
    }

    // DISABLED FOR NOW, see src/lib/rateLimit.js
    // const limit = await checkCommentLimits({ userId, ipHash })
    // if (!limit.ok) {
    //   return json(
    //     { error: 'You are commenting too quickly. Please try again later.' },
    //     429,
    //     { 'Retry-After': String(limit.retryAfter) },
    //   )
    // }

    if (await isDuplicate({ slug, body, userId, ipHash })) {
      return json({ error: 'You already posted this comment.' }, 409)
    }

    let parentId = null
    if (payload.parentId != null && payload.parentId !== '') {
      parentId = await resolveParentId(slug, payload.parentId)
      if (!parentId) {
        return json({ error: 'The comment you are replying to is no longer available.' }, 409)
      }
    }

    const row = await insertComment({
      slug,
      parentId,
      userId,
      authorName,
      authorImage: viewer?.image ?? null,
      body,
      ipHash,
    })

    return json({ comment: { ...serializeComment(row, userId), replies: [] } }, 201)
  } catch (error) {
    console.error(`Failed to post comment on "${slug}"`, error)
    return json({ error: 'Could not post your comment. Please try again.' }, 500)
  }
}
