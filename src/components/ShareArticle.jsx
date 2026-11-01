'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { LinkedInIcon, XIcon } from '@/components/SocialIcons'
import { articleShareUrl, linkedInShareUrl, xShareUrl } from '@/lib/shareLinks'

function LinkIcon(props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6.5 9.5 9.5 6.5" />
      <path d="M5.75 7.5 4.5 8.75a2.475 2.475 0 0 0 3.5 3.5L9.25 11" />
      <path d="M10.25 8.5 11.5 7.25a2.475 2.475 0 0 0-3.5-3.5L6.75 5" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  )
}

function ShareIcon(props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11.5" cy="3.5" r="2" />
      <circle cx="4.5" cy="8" r="2" />
      <circle cx="11.5" cy="12.5" r="2" />
      <path d="M6.2 6.9 9.8 4.6" />
      <path d="M6.2 9.1 9.8 11.4" />
    </svg>
  )
}

/** Long enough for the confirmation to be read, short enough to be forgotten. */
const COPIED_RESET_MS = 2000

/**
 * The async clipboard needs a permission that an insecure origin, an embedded
 * frame or a stricter browser can refuse outright. execCommand is deprecated
 * but asks for nothing, so it still covers those cases.
 */
function copyFallback(text) {
  let field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)

  try {
    field.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyFallback(text)
  }
}

/**
 * One action behind both share buttons: hand the article to the OS share
 * sheet where there is one — on a phone that's where the reader's own apps
 * live — and copy the link everywhere else.
 */
function useShareAction({ slug, title }) {
  let [canShare, setCanShare] = useState(false)
  let [copied, setCopied] = useState(false)
  let timer = useRef(null)

  // Read after hydration: the server has no navigator, so deciding what the
  // button says during render would make the two passes disagree.
  useEffect(() => setCanShare(typeof navigator.share === 'function'), [])
  // Navigating away mid-confirmation would otherwise leave the timeout to fire
  // against an unmounted button.
  useEffect(() => () => clearTimeout(timer.current), [])

  let url = articleShareUrl(slug)

  async function copy() {
    // Nothing to fall back to if both clipboard routes fail, and the URL is in
    // the address bar either way — just don't claim it worked.
    if (!(await copyToClipboard(url))) return

    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  async function share() {
    if (!canShare) return copy()

    try {
      await navigator.share({ title, url })
    } catch (error) {
      // Dismissing the sheet rejects with AbortError, which is the reader
      // changing their mind rather than a failure worth falling back from.
      if (error?.name !== 'AbortError') await copy()
    }
  }

  return { canShare, copied, share }
}

/** The icon beside the date. */
export function ShareButton({ slug, title, className }) {
  let { canShare, copied, share } = useShareAction({ slug, title })

  let label = canShare
    ? 'Share this article'
    : copied
      ? 'Link copied'
      : 'Copy a link to this article'

  return (
    <button
      type="button"
      onClick={share}
      title={label}
      aria-label={label}
      aria-live="polite"
      className={clsx(
        'group flex h-8 w-8 flex-none items-center justify-center border-2 border-black bg-white shadow-brutal-sm transition hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal active:translate-x-px active:translate-y-px active:shadow-none dark:border-white dark:bg-zinc-800 dark:shadow-brutal-sm-dark dark:hover:shadow-brutal-dark',
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 stroke-blue-600 dark:stroke-blue-400" />
      ) : (
        <ShareIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-400 dark:group-hover:stroke-zinc-200" />
      )}
    </button>
  )
}

/**
 * The first button in the row at the foot of the article. It runs the same
 * action as the icon at the top, so a phone reader reaches their own apps from
 * either end of the page; the label follows, since "Copy link" would be a lie
 * once the sheet is what opens.
 */
function ShareLinkButton({ slug, title }) {
  let { canShare, copied, share } = useShareAction({ slug, title })

  let Icon = canShare ? ShareIcon : copied ? CheckIcon : LinkIcon
  let label = canShare ? 'Share' : copied ? 'Copied' : 'Copy link'

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={share}
      aria-live="polite"
    >
      <Icon
        className={clsx(
          'h-4 w-4',
          copied && !canShare && 'stroke-blue-600 dark:stroke-blue-400',
        )}
      />
      {/* Only the copy label swaps, and monospace makes a fixed character
          width exact, so the row can't reflow underneath the confirmation. */}
      <span
        className={clsx('inline-block text-left', !canShare && 'min-w-[9ch]')}
      >
        {label}
      </span>
    </Button>
  )
}

/**
 * The share row under an article. Deliberately a set of plain links rather
 * than a popover or an SDK embed: no third-party script, nothing to consent
 * to, and each target unfurls the article's own Open Graph card.
 */
export function ShareArticle({ slug, title }) {
  let share = { url: articleShareUrl(slug), title }

  let targets = [
    {
      label: 'X',
      description: 'Share on X',
      href: xShareUrl(share),
      icon: XIcon,
      iconClassName: 'h-4 w-4 fill-current',
    },
    {
      label: 'LinkedIn',
      description: 'Share on LinkedIn',
      href: linkedInShareUrl(share),
      icon: LinkedInIcon,
      iconClassName: 'h-4 w-4 fill-current',
    },
  ]

  return (
    <section
      aria-labelledby="share-heading"
      className="mt-16 border-t-2 border-black pt-6 dark:border-white"
    >
      <h2
        id="share-heading"
        className="text-[0.6875rem] font-bold uppercase leading-4 tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        Share this
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ShareLinkButton slug={slug} title={title} />
        {targets.map(
          ({ label, description, href, icon: Icon, iconClassName }) => (
            <Button
              key={label}
              href={href}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={description}
            >
              <Icon className={iconClassName} />
              {label}
            </Button>
          ),
        )}
      </div>
    </section>
  )
}
