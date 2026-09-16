'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { getCommands, getExtraCommands } from '@uiw/react-md-editor'
import clsx from 'clsx'

import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { Button } from '@/components/Button'
import { Prose } from '@/components/Prose'
import { DiagramBuilderModal } from '@/components/studio/DiagramBuilderModal'
import { ImageUploadModal } from '@/components/studio/ImageUploadModal'
import { slugify } from '@/lib/articleFile'

// react-md-editor touches the DOM/CodeMirror at import time, so it can only
// run client-side.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const imageIcon = (
  <svg width="13" height="13" viewBox="0 0 20 20">
    <path
      fill="currentColor"
      d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
    />
  </svg>
)

const diagramIcon = (
  <svg width="13" height="13" viewBox="0 0 20 20">
    <circle cx="4" cy="4" r="3" fill="currentColor" />
    <circle cx="16" cy="4" r="3" fill="currentColor" />
    <circle cx="10" cy="16" r="3" fill="currentColor" />
    <path stroke="currentColor" strokeWidth="1.5" d="M6 5.5 8.5 14M14 5.5 11.5 14M7 4h6" />
  </svg>
)

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function newPendingImageId() {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `img${Math.random().toString(36).slice(2)}`
}

function TabButton({ active, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'rounded-md border-2 border-zinc-900 px-3 py-1.5 text-sm font-medium transition dark:border-zinc-100',
        active
          ? 'bg-zinc-800 text-zinc-100 shadow-brutal-sm dark:bg-zinc-700 dark:shadow-brutal-sm-dark'
          : 'bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
      )}
      {...props}
    />
  )
}

function Field({ label, className, children }) {
  return (
    <label
      className={clsx(
        'flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200',
        className,
      )}
    >
      {label}
      {children}
    </label>
  )
}

const inputClassName =
  'rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100'

export function ArticleEditor({ mode, slug: initialSlug, sha, initialValues }) {
  let router = useRouter()
  let [title, setTitle] = useState(initialValues.title)
  let [date, setDate] = useState(initialValues.date)
  let [description, setDescription] = useState(initialValues.description)
  let [body, setBody] = useState(initialValues.body)
  let [slug, setSlug] = useState(initialSlug || '')
  let [slugTouched, setSlugTouched] = useState(mode === 'edit')
  let [tab, setTab] = useState('write')
  let [previewHtml, setPreviewHtml] = useState('')
  let [previewLoading, setPreviewLoading] = useState(false)
  let [error, setError] = useState(null)
  let [saving, setSaving] = useState(false)
  let [imageModalOpen, setImageModalOpen] = useState(false)
  let [diagramModalOpen, setDiagramModalOpen] = useState(false)
  let editorApiRef = useRef(null)
  // Files picked via "Insert image" but not yet committed to GitHub — keyed
  // by the `pending:<id>` placeholder written into the body text. Actually
  // uploaded only at publish time, and swapped for the real URL in the
  // Preview tab in the meantime via a local blob URL.
  let pendingImagesRef = useRef(new Map())
  let previewObjectUrlsRef = useRef([])

  let effectiveSlug = slugTouched ? slug : slugify(title)

  let insertImageCommand = {
    name: 'insert-image-upload',
    keyCommand: 'insert-image-upload',
    buttonProps: { 'aria-label': 'Insert image', title: 'Insert image' },
    icon: imageIcon,
    execute: (state, api) => {
      editorApiRef.current = api
      setImageModalOpen(true)
    },
  }

  let insertDiagramCommand = {
    name: 'insert-diagram-builder',
    keyCommand: 'insert-diagram-builder',
    buttonProps: { 'aria-label': 'Insert diagram', title: 'Insert diagram' },
    icon: diagramIcon,
    execute: (state, api) => {
      editorApiRef.current = api
      setDiagramModalOpen(true)
    },
  }

  async function showPreview() {
    setTab('preview')
    setPreviewLoading(true)
    setError(null)

    let response = await fetch('/api/studio/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    let data = await response.json()
    setPreviewLoading(false)

    if (!response.ok) {
      setError(data.error || 'Preview failed')
      return
    }

    // Swap `pending:<id>` placeholders for local blob URLs so images picked
    // but not yet published still show up in the preview.
    previewObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewObjectUrlsRef.current = []

    let html = data.html
    for (let [id, file] of pendingImagesRef.current) {
      if (!html.includes(`pending:${id}`)) continue
      let objectUrl = URL.createObjectURL(file)
      previewObjectUrlsRef.current.push(objectUrl)
      html = html.replaceAll(`pending:${id}`, objectUrl)
    }

    setPreviewHtml(html)
  }

  async function handlePublish() {
    setSaving(true)
    setError(null)

    // Base64-encode any images still referenced as `pending:<id>` in the
    // body and send them alongside the article text — the server commits
    // the article file and every image together as a single atomic commit,
    // so there's no separate "upload" step and no partial-failure state to
    // reconcile if the publish itself fails.
    let images = []
    try {
      for (let [id, file] of pendingImagesRef.current) {
        if (!body.includes(`pending:${id}`)) continue
        images.push({ id, filename: file.name, contentBase64: await readFileAsBase64(file) })
      }
    } catch {
      setError('Could not read one of the inserted images.')
      setSaving(false)
      return
    }

    let response = await fetch(`/api/studio/articles/${effectiveSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, description, body, sha, images }),
    })
    let data = await response.json().catch(() => ({}))
    setSaving(false)

    if (!response.ok) {
      setError(data.error || 'Publish failed')
      return
    }

    router.push('/studio')
    router.refresh()
  }

  let canPublish = title && effectiveSlug && date && description && body && !saving

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
        {mode === 'edit' ? 'Edit article' : 'New article'}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-md border-2 border-zinc-900 p-6 shadow-brutal-sm dark:border-zinc-100 dark:shadow-brutal-sm-dark sm:grid-cols-2">
        <Field label="Title">
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (!slugTouched) setSlug(slugify(event.target.value))
            }}
            className={inputClassName}
          />
        </Field>
        <Field label="Slug">
          <input
            value={effectiveSlug}
            disabled={mode === 'edit'}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(slugify(event.target.value))
            }}
            className={inputClassName}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClassName}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-6">
        <div className="flex gap-2">
          <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
            Write
          </TabButton>
          <TabButton active={tab === 'preview'} onClick={showPreview}>
            Preview
          </TabButton>
        </div>

        {tab === 'write' ? (
          <div data-color-mode="light" className="studio-md-editor mt-3">
            <MDEditor
              value={body}
              onChange={setBody}
              height={480}
              preview="edit"
              commands={[...getCommands(), insertImageCommand, insertDiagramCommand]}
              extraCommands={getExtraCommands()}
            />
          </div>
        ) : (
          <div className="mt-3 min-h-[480px] rounded-md border-2 border-zinc-900 bg-white p-6 dark:border-zinc-100 dark:bg-zinc-900">
            {previewLoading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Rendering…
              </p>
            ) : (
              <Prose dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 whitespace-pre-wrap rounded-md border-2 border-red-600 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={handlePublish} disabled={!canPublish}>
          {saving ? 'Publishing…' : mode === 'edit' ? 'Save changes' : 'Publish'}
        </Button>
      </div>

      <ImageUploadModal
        open={imageModalOpen}
        onInsert={(file, alt, width) => {
          let id = newPendingImageId()
          pendingImagesRef.current.set(id, file)
          let widthAttr = width ? ` width={${width}}` : ''
          editorApiRef.current?.replaceSelection(
            `<img src="pending:${id}" alt={${JSON.stringify(alt)}}${widthAttr} />`,
          )
          setImageModalOpen(false)
        }}
        onClose={() => setImageModalOpen(false)}
      />

      <DiagramBuilderModal
        open={diagramModalOpen}
        onInsert={(snippet) => {
          editorApiRef.current?.replaceSelection(snippet)
          setDiagramModalOpen(false)
        }}
        onClose={() => setDiagramModalOpen(false)}
      />
    </div>
  )
}
