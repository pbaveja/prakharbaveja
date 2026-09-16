'use client'

import { useState } from 'react'

import { Button } from '@/components/Button'

// Mirrors the cap enforced server-side when the article is published,
// checked here too so oversized files are rejected immediately rather than
// only once the user hits Publish.
const MAX_BYTES = 2 * 1024 * 1024

// Preset display widths, in px, relative to the article column (max-w-2xl,
// 672px — see ArticleLayout.jsx). `null` means "full width": no width
// attribute, so the image renders at its natural size capped at 100% of the
// column by the site's global img styling.
const SIZE_PRESETS = [
  { label: 'Small', width: 320 },
  { label: 'Medium', width: 480 },
  { label: 'Large', width: 640 },
  { label: 'Full width', width: null },
]

export function ImageUploadModal({ open, onInsert, onClose }) {
  let [file, setFile] = useState(null)
  let [previewUrl, setPreviewUrl] = useState(null)
  let [alt, setAlt] = useState('')
  let [width, setWidth] = useState(SIZE_PRESETS[1].width)
  let [error, setError] = useState(null)

  if (!open) return null

  function handleFileChange(event) {
    let selected = event.target.files?.[0] || null
    setError(null)

    if (selected && selected.size > MAX_BYTES) {
      setFile(null)
      setPreviewUrl(null)
      setError('Image is too large — please choose something under 2MB.')
      return
    }

    setFile(selected)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  function reset() {
    setFile(null)
    setPreviewUrl(null)
    setAlt('')
    setWidth(SIZE_PRESETS[1].width)
    setError(null)
  }

  function handleInsertClick() {
    if (!file) return
    onInsert(file, alt, width)
    reset()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-md border-2 border-zinc-900 bg-white p-6 shadow-brutal dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-brutal-dark">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Insert image
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          The image is committed to GitHub when you publish or save the article, not now.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm text-zinc-800 dark:text-zinc-200"
          />

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-48 rounded-md border-2 border-zinc-900 object-contain dark:border-zinc-100"
            />
          )}

          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Alt text
            <input
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe the image"
              className="rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Size
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setWidth(preset.width)}
                  className={
                    'rounded-md border-2 border-zinc-900 px-2.5 py-1 text-xs font-medium transition dark:border-zinc-100 ' +
                    (width === preset.width
                      ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-700'
                      : 'bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200')
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleInsertClick} disabled={!file}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  )
}
