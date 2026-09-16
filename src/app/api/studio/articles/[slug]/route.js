import { NextResponse } from 'next/server'

import { buildArticleFile, parseArticleFile } from '@/lib/articleFile'
import { commitFiles, getArticleFile } from '@/lib/github'
import { buildImagePath } from '@/lib/imagePath'
import { validateArticleSource } from '@/lib/mdxValidate'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

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
  const { title, date, description, body, sha, images } = await request.json().catch(() => ({}))

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

  // Images picked in the editor aren't uploaded until publish, so resolve
  // any still-referenced `pending:<id>` placeholders to their final
  // committed path here — the resulting file goes into the SAME commit as
  // the article text below, rather than a separate upload beforehand.
  let resolvedBody = body
  let imageFiles = []
  for (const image of images || []) {
    let placeholder = `pending:${image.id}`
    if (!resolvedBody.includes(placeholder)) continue // removed from the body before publishing

    let approxBytes = Math.ceil((image.contentBase64.length * 3) / 4)
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `"${image.filename}" is too large — please use something under 2MB.` },
        { status: 413 },
      )
    }

    let { path, url } = buildImagePath(slug, image.filename, image.contentBase64)
    resolvedBody = resolvedBody.replaceAll(placeholder, url)
    imageFiles.push({ path, content: image.contentBase64, encoding: 'base64' })
  }

  const fileSource = buildArticleFile({ title, date, description, body: resolvedBody })

  const validation = await validateArticleSource(fileSource)
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: `MDX validation failed${validation.line ? ` at line ${validation.line}` : ''}: ${validation.message}`,
      },
      { status: 422 },
    )
  }

  const articlePath = `src/app/articles/${slug}/page.mdx`

  try {
    await commitFiles(
      [{ path: articlePath, content: fileSource, encoding: 'utf-8' }, ...imageFiles],
      { message: sha ? `Update article: ${slug}` : `Publish article: ${slug}` },
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  return NextResponse.json({ ok: true })
}
