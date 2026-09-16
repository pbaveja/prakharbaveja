import { auth } from '@/auth'

function adminUserIds() {
  return new Set(
    (process.env.ADMIN_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

export function isAdminUserId(userId) {
  return Boolean(userId) && adminUserIds().has(userId)
}

export function providerOf(userId) {
  return userId ? userId.split(':')[0] : null
}

/** Only keep https avatar URLs coming from the OAuth provider. */
export function safeImageUrl(url) {
  return typeof url === 'string' && url.startsWith('https://') ? url : null
}

/**
 * The signed-in commenter, or null. Auth failures (e.g. auth not configured
 * yet) degrade to "signed out" so guest comments keep working.
 */
export async function getViewer() {
  try {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return null

    return {
      id: user.id,
      name: (user.name || user.email?.split('@')[0] || 'Anonymous').slice(0, 80),
      image: safeImageUrl(user.image),
      provider: providerOf(user.id),
      isAdmin: isAdminUserId(user.id),
    }
  } catch (error) {
    console.error('Failed to read commenter session', error)
    return null
  }
}
