import { NextResponse } from 'next/server'

import { renderMdxPreview } from '@/lib/mdxValidate'

export async function POST(request) {
  const { body } = await request.json().catch(() => ({}))

  try {
    const html = await renderMdxPreview(body || '')
    return NextResponse.json({ html })
  } catch (error) {
    return NextResponse.json(
      {
        error: `MDX validation failed${error.line ? ` at line ${error.line}` : ''}: ${error.message}`,
      },
      { status: 422 },
    )
  }
}
