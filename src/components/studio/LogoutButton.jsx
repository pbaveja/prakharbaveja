'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/Button'

export function LogoutButton() {
  let router = useRouter()

  async function handleLogout() {
    await fetch('/api/studio/logout', { method: 'POST' })
    router.push('/studio/login')
    router.refresh()
  }

  return (
    <Button type="button" variant="secondary" onClick={handleLogout}>
      Log out
    </Button>
  )
}
