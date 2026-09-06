import { NextResponse } from 'next/server'

import { buildArticleFile, parseArticleFile } from '@/lib/articleFile'
import { getArticleFile, putArticleFile } from '@/lib/github'
import { validateArticleSource } from '@/lib/mdxValidate'

export async function GET(request, { params }) {
  const file = await getArticleFile(params.slug)
  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const parsed = parseArticleFile(file.content)
    return NextResponse.json({ ...parsed, slug: params.slug, sha: file.sha })
  } catch (error) {
    return NextResponse.json(
      { error: `Could not parse this article's metadata: ${error.message}` },
      { status: 422 },
    )
  }
}

export async function PUT(request, { params }) {
  const { slug } = params
  const { title, date, description, body, sha } = await request.json().catch(() => ({}))

  if (!title || !date || !description || !body) {
    return NextResponse.json(
      { error: 'Title, date, description and body are all required' },
      { status: 400 },
    )
  }

  const existing = await getArticleFile(slug)

  // Editing: the sha we loaded the article with must still match, or someone
  // else (or another tab) published a newer version underneath us.
  if (sha && existing && existing.sha !== sha) {
    return NextResponse.json(
      { error: 'This article changed since you loaded it. Refresh and try again.' },
      { status: 409 },
    )
  }

  // Creating: refuse to silently overwrite an unrelated existing slug.
  if (!sha && existing) {
    return NextResponse.json(
      { error: `An article with slug "${slug}" already exists.` },
      { status: 409 },
    )
  }

  const fileSource = buildArticleFile({ title, date, description, body })

  const validation = await validateArticleSource(fileSource)
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: `MDX validation failed${validation.line ? ` at line ${validation.line}` : ''}: ${validation.message}`,
      },
      { status: 422 },
    )
  }

  const result = await putArticleFile(slug, fileSource, { sha: existing?.sha })
  return NextResponse.json({ ok: true, commit: result.commit?.sha })
}
