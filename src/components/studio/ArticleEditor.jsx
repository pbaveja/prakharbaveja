'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { Button } from '@/components/Button'
import { Prose } from '@/components/Prose'
import { slugify } from '@/lib/articleFile'

// react-md-editor touches the DOM/CodeMirror at import time, so it can only
// run client-side.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

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

  let effectiveSlug = slugTouched ? slug : slugify(title)

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

    setPreviewHtml(data.html)
  }

  async function handlePublish() {
    setSaving(true)
    setError(null)

    let response = await fetch(`/api/studio/articles/${effectiveSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, description, body, sha }),
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
            <MDEditor value={body} onChange={setBody} height={480} preview="edit" />
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
    </div>
  )
}
