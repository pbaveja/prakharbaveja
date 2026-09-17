export const MAX_BODY_LENGTH = 2000
export const MIN_NAME_LENGTH = 2
export const MAX_NAME_LENGTH = 40
export const MAX_GUEST_LINKS = 2

const RESERVED_GUEST_NAMES = new Set([
  'prakhar',
  'prakhar baveja',
  'pbaveja',
  'admin',
  'author',
  'moderator',
])

const URL_PATTERN = /(https?:\/\/|www\.)\S+/gi
const DOMAIN_PATTERN = /\b[a-z0-9-]+\.(com|net|org|io|dev|co|in|xyz|app|ru)\b/i

function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function countLinks(body) {
  return (body.match(URL_PATTERN) || []).length
}

/** Returns an error message, or null when the body is fine. */
export function validateBody(body, { isGuest }) {
  if (typeof body !== 'string' || !body.trim()) {
    return 'Comment cannot be empty.'
  }
  if (body.trim().length > MAX_BODY_LENGTH) {
    return `Comment must be ${MAX_BODY_LENGTH} characters or fewer.`
  }
  if (isGuest && countLinks(body) > MAX_GUEST_LINKS) {
    return `Guest comments can include at most ${MAX_GUEST_LINKS} links. Sign in to post more.`
  }
  return null
}

/** Returns an error message, or null when the guest display name is fine. */
export function validateGuestName(name) {
  if (typeof name !== 'string') {
    return 'Please enter a name.'
  }
  const trimmed = name.replace(/\s+/g, ' ').trim()
  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
    return `Name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters.`
  }
  if (countLinks(trimmed) > 0 || DOMAIN_PATTERN.test(trimmed)) {
    return 'Name cannot contain a link.'
  }
  if (RESERVED_GUEST_NAMES.has(normalizeName(trimmed))) {
    return 'That name is reserved. Please pick another, or sign in.'
  }
  return null
}

/** Bots fill every field; humans never see the honeypot. */
export function isHoneypotTripped(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function cleanGuestName(name) {
  return name.replace(/\s+/g, ' ').trim()
}
