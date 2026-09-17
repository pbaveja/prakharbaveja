const UNITS = [
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
]

/**
 * Short human-readable count: 999 → "999", 1999 → "1.9K", 12345678 → "12.3M".
 *
 * Always truncates (never rounds up), so the short form never overstates the
 * real number. Done with integer math instead of Intl's `roundingMode` so the
 * output is identical on every Node version and browser (no hydration drift).
 */
export function formatCount(value) {
  const n = Math.max(0, Math.floor(Number(value) || 0))

  for (const { value: unit, suffix } of UNITS) {
    if (n >= unit) {
      // Tenths of a unit, truncated: 1999 → 19 → "1.9"
      const tenths = Math.floor(n / (unit / 10))
      const whole = Math.floor(tenths / 10)
      const fraction = tenths % 10
      return `${whole}${fraction ? `.${fraction}` : ''}${suffix}`
    }
  }

  return String(n)
}

/** Exact count with thousands separators: 1234567 → "1,234,567". */
export function formatExact(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('en-US')
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural
}
