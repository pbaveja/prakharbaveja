'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Prose } from '@/components/Prose'

// Safe subset only: raw HTML is dropped (skipHtml), images/headings/tables are
// unwrapped to their text, and react-markdown's default urlTransform already
// strips javascript:/data: URLs.
const ALLOWED_ELEMENTS = [
  'p',
  'a',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'br',
]

const components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="nofollow ugc noopener noreferrer" />
  ),
}

export function CommentBody({ children }) {
  return (
    <Prose className="prose-sm max-w-none break-words prose-p:my-2 prose-pre:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        skipHtml
        components={components}
      >
        {children}
      </ReactMarkdown>
    </Prose>
  )
}
