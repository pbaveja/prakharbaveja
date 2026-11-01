import { describe, expect, it } from 'vitest'

import { articleShareUrl, linkedInShareUrl, xShareUrl } from './shareLinks'

const share = {
  url: 'https://prakharbaveja.com/articles/some-slug',
  title: 'Reliable HTTP file uploads & you',
}

describe('articleShareUrl', () => {
  it('is absolute, so the link still works off-site', () => {
    expect(articleShareUrl('some-slug')).toBe(
      'https://prakharbaveja.com/articles/some-slug',
    )
  })
})

describe('share targets', () => {
  it.each([
    ['x', xShareUrl],
    ['linkedin', linkedInShareUrl],
  ])('%s carries the article URL encoded', (_name, build) => {
    let href = build(share)
    expect(href.startsWith('https://')).toBe(true)
    expect(href).toContain(encodeURIComponent(share.url))
    // The raw URL must not appear unescaped: its own `/` and `:` would end
    // the parameter early in some readers.
    expect(href).not.toContain(`=${share.url}`)
  })

  it('passes the title to the targets that take one', () => {
    expect(new URL(xShareUrl(share)).searchParams.get('text')).toBe(share.title)
  })

  it('sends LinkedIn only the URL, which it unfurls itself', () => {
    expect([...new URL(linkedInShareUrl(share)).searchParams.keys()]).toEqual([
      'url',
    ])
  })
})
