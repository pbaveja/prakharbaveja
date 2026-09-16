/** "just now", "5m ago", "3h ago", "6d ago", then a full date. */
export function formatRelativeTime(isoString, now = Date.now()) {
  let seconds = Math.max(0, Math.floor((now - new Date(isoString).getTime()) / 1000))

  if (seconds < 60) return 'just now'
  if (seconds < 60 * 60) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 60 * 60 * 24) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 60 * 60 * 24 * 7) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(isoString.slice(0, 10))
}

export function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
