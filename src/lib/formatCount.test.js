import { describe, expect, it } from 'vitest'

import { formatCount, formatExact, pluralize } from './formatCount'

describe('formatCount', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [999, '999'],
    [1000, '1K'],
    [1049, '1K'],
    [1099, '1K'],
    [1100, '1.1K'],
    [1999, '1.9K'],
    [12345, '12.3K'],
    [999999, '999.9K'],
    [1_000_000, '1M'],
    [12_345_678, '12.3M'],
    [1_234_567_890, '1.2B'],
  ])('formats %d as %s', (input, expected) => {
    expect(formatCount(input)).toBe(expected)
  })

  it('never goes below zero or shows fractions', () => {
    expect(formatCount(-5)).toBe('0')
    expect(formatCount(12.9)).toBe('12')
    expect(formatCount(undefined)).toBe('0')
    expect(formatCount('1500')).toBe('1.5K')
  })
})

describe('formatExact', () => {
  it('adds thousands separators', () => {
    expect(formatExact(1234567)).toBe('1,234,567')
    expect(formatExact(0)).toBe('0')
  })
})

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(1, 'view')).toBe('view')
    expect(pluralize(0, 'view')).toBe('views')
    expect(pluralize(2, 'comment')).toBe('comments')
  })
})
