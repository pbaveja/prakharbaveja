'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/Button'

export default function StudioLoginPage() {
  let router = useRouter()
  let [password, setPassword] = useState('')
  let [error, setError] = useState(null)
  let [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    let response = await fetch('/api/studio/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (response.ok) {
      router.push('/studio')
      router.refresh()
      return
    }

    let data = await response.json().catch(() => ({}))
    setError(data.error || 'Something went wrong')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
        Studio
      </h1>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4 rounded-md border-2 border-zinc-900 p-6 shadow-brutal-sm dark:border-zinc-100 dark:shadow-brutal-sm-dark"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Passphrase
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
            className="rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Enter'}
        </Button>
      </form>
    </div>
  )
}
