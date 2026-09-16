import { NextResponse } from 'next/server'

import { BLOCK_KINDS, addBlock, removeBlock } from '@/lib/moderation'

// Protected by src/middleware.js (matches /api/studio/*).

async function readBlock(request) {
  const { kind, value, reason } = await request.json().catch(() => ({}))
  if (!BLOCK_KINDS.includes(kind) || typeof value !== 'string' || !value.trim()) {
    return null
  }
  return {
    kind,
    value: value.trim(),
    reason: typeof reason === 'string' ? reason.slice(0, 200) : null,
  }
}

export async function POST(request) {
  const block = await readBlock(request)
  if (!block) {
    return NextResponse.json({ error: 'Invalid block' }, { status: 400 })
  }
  await addBlock(block)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request) {
  const block = await readBlock(request)
  if (!block) {
    return NextResponse.json({ error: 'Invalid block' }, { status: 400 })
  }
  await removeBlock(block)
  return NextResponse.json({ ok: true })
}
