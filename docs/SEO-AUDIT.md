# Level 1 SEO Audit & Optimisation Plan

Audited 2 Nov 2026 against the live site (`https://prakharbaveja.com`) and this
repo at `master` / `87d3127`. Scope is deliberately "level 1": the basics that
every indexed site should have. No keyword strategy, no link building, no
content rewrites beyond fixing things that are actively broken.

---

## Verdict

The foundations that Next.js gives you for free are fine — one `<h1>` per page,
clean slugs, semantic `<article>`/`<time>`, HTTPS, `www` → apex and `http` →
`https` 308s, trailing-slash normalisation, static rendering, good Core Web
Vitals shape (self-hosted font via `next/font`, `next/image`).

What's missing is almost everything a crawler or a social platform looks for
*beyond* the title tag. There is no sitemap, no robots.txt, no canonical URLs,
no Open Graph or Twitter card tags anywhere on the site, and no structured data.
The RSS feed is still shipping the Tailwind template's placeholder author.

Nothing here is hard. It's roughly a half-day of work, and most of it is five
new small files.

---

## What's actually live right now

Head of every page, in full:

```html
<title>Enter Jev - a System One model - Prakhar Baveja</title>
<meta name="description" content="Came across Jev while building an app…" />
<link rel="alternate" type="application/rss+xml" href="…/feed.xml" />
<link rel="icon" href="/favicon.ico" sizes="575x575" />
```

That's it. Verified responses:

| Check | Result |
| --- | --- |
| `/robots.txt` | **404** (fixed, not yet deployed) |
| `/sitemap.xml` | **404** (fixed, not yet deployed) |
| `/feed.xml` | 200, but author is `Spencer Sharp` (fixed, not yet deployed) |
| Open Graph tags | **none, site-wide** |
| Twitter card tags | **none, site-wide** |
| Canonical link | **none, site-wide** |
| JSON-LD structured data | **none** |
| `metadataBase` | **not set** |
| `www` → apex | 308 ✅ |
| `http` → `https` | 308 ✅ |
| `/articles/` → `/articles` | 308 ✅ |
| `/studio/login` | **200 and indexable** |

---

## Findings

### P0 — fix first

**1. No sitemap, no robots.txt.**
Google has no manifest of your URLs and no crawl directives. For a seven-article
blog with no external backlinks, this is the single biggest discovery gap.

**2. Zero Open Graph / Twitter tags.**
Every share of every article — X, LinkedIn, WhatsApp, Slack, iMessage — renders
as a bare grey link with no image, and often with the `<title>` truncated or
the URL shown instead of the title. You publish about work you want read; this
is the highest-leverage fix on the list. (Image concept is covered separately.)

**3. `feed.xml` still has template placeholders.** — fixed
[src/app/feed.xml/route.js](../src/app/feed.xml/route.js) hardcodes
`Spencer Sharp`, `spencer@planetaria.tech`, and `Your blog description`. This is
live and public. Anyone who subscribes in an RSS reader sees someone else's name
on your posts. It also means every `<author>` and `<dc:creator>` in the feed is
wrong.

**4. `metadataBase` is not set.**
Without it, Next.js resolves relative OG/canonical URLs against `localhost` in
dev and emits a build warning. Set it once in the root layout and everything
downstream becomes relative-safe.

### P1 — do in the same pass

**5. No canonical URLs.**
Low risk today because Vercel normalises the obvious duplicates, but Vercel
preview deployments *are* crawlable and *are* duplicate content. One
`alternates.canonical` per route closes it.

**6. `/uses` and `/speaking` are unedited template content.**
[src/app/uses/page.jsx](../src/app/uses/page.jsx) still says "when you're
working at planetary scale, every pixel counts" and lists an Apple Pro Display
XDR and an IBM Model M. [src/app/speaking/page.jsx](../src/app/speaking/page.jsx)
claims "I've spoken at events all around the world and been interviewed for many
podcasts." Both are commented out of the nav but both return 200 and are
crawlable. These are fabricated claims attributed to you on your own domain —
a credibility problem before it's an SEO one. Delete them or gate them behind
`noindex`; do **not** put them in the sitemap.

**7. `/studio*` is indexable.**
The middleware redirects unauthenticated users to `/studio/login`, which returns
200. Add `robots: { index: false }` to the studio segment and `Disallow: /studio`
plus `Disallow: /api` in robots.txt.

**8. `reliable-http-file-uploads` has four `<h1>` elements.** — fixed
[page.mdx:19-23](../src/app/articles/reliable-http-file-uploads/page.mdx) uses
`#` for three full paragraphs of prose, so they render as page-level headings
alongside the real title. Verified: 4 `<h1>` tags on the live page. It reads as
three enormous paragraphs and tells a crawler the page has four competing
topics. Convert line 19 to body text and lines 21/23 to `##`.

**9. No structured data.**
`BlogPosting` on articles and `Person` on the homepage. Cheap, and it's what
feeds rich results and author attribution.

### P2 — nice to have

**10. Weak `alt` text.** The only content image on the site is
`alt={"app-flow"}` ([page.mdx:157](../src/app/articles/can-a-small-language-model-understand-my-bank-messages/page.mdx)).
Describe what the diagram shows.

**11. Favicon declares `sizes="575x575"`.** Harmless but wrong. While you're
there, add `apple-touch-icon` (180×180) and a `site.webmanifest`.

**12. Root description is stale.** "Be it a SaaS, RESTful API or an elegant
box-shadow" describes a freelance portfolio. The site is now a writing-first
blog about building with AI, SLMs and side projects. The homepage copy already
says this; the meta description hasn't caught up.

**13. No `lastModified` signal.** Articles expose a publish date only. Once the
sitemap exists, feed it real `lastModified` values (git mtime is fine).

---

## The plan

Five new files, four small edits. Ordered so each step is independently
shippable.

> **Status, 2 Nov 2026:** steps 1-4 are **done** — see
> [OG-IMAGE-CONCEPT.md](OG-IMAGE-CONCEPT.md) for the share cards — and the feed
> is rewritten. Still open: JSON-LD (step 5), the rest of the content fixes
> (step 6) and Search Console (step 7).

### Step 1 — `metadataBase` + a single source of truth — done

In [src/app/layout.jsx](../src/app/layout.jsx), add to `metadata`:

```js
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prakharbaveja.com'),
alternates: { canonical: '/', types: { 'application/rss+xml': '/feed.xml' } },
openGraph: {
  type: 'website',
  siteName: 'Prakhar Baveja',
  locale: 'en_US',
  url: '/',
},
twitter: { card: 'summary_large_image', creator: '@<your handle>' },
```

Also refresh the root `description` (finding 12).

### Step 2 — `app/robots.js` and `app/sitemap.js` — done

Both are ~15-line Next.js file conventions. The sitemap reads
`getAllArticles()` from [src/lib/articles.js](../src/lib/articles.js), so it
stays correct automatically on every publish. Include `/`, `/articles`,
`/projects`, `/spotify`, and each `/articles/<slug>`. Exclude `/studio`,
`/api`, `/thank-you`, and `/uses` + `/speaking` (if you keep them).

```js
// src/app/robots.js
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/api', '/thank-you'] },
    sitemap: 'https://prakharbaveja.com/sitemap.xml',
    host: 'https://prakharbaveja.com',
  }
}
```

### Step 3 — per-article metadata via one shared helper — done

Don't hand-write OG blocks into seven MDX files — the Studio generator
([src/lib/articleFile.js](../src/lib/articleFile.js)) would then have to emit
them too, and they'd drift. Add `src/lib/articleMetadata.js`:

```js
export function articleMetadata(article, slug) {
  const url = `/articles/${slug}`
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      authors: [article.author],
      images: [`${url}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.description },
  }
}
```

Then each MDX becomes a one-liner:

```js
export const metadata = articleMetadata(article, 'enter-jev-a-system-one-model')
```

Update `buildArticleFile` in `src/lib/articleFile.js` to emit exactly that, so
every Studio publish is correct by construction. Seven existing files get a
two-line patch each.

> The slug has to be passed explicitly because `ArticleLayout` currently derives
> it from `usePathname()` at runtime, which isn't available in the metadata
> export. Passing it as a string is the simplest fix and the generator already
> knows the slug.

### Step 4 — Open Graph images — done

Built as a route handler at `/og/articles/<slug>` rather than the
`[slug]/opengraph-image.js` file convention, because the article folders are
static segments and would shadow it. Ten cards in all, prerendered at build
time. Full write-up in [OG-IMAGE-CONCEPT.md](OG-IMAGE-CONCEPT.md).

### Step 5 — structured data

A `<script type="application/ld+json">` in `ArticleLayout` emitting
`BlogPosting` (headline, datePublished, author, image, mainEntityOfPage), and
`Person` + `WebSite` on the homepage. Server-rendered, no client JS.

### Step 6 — content fixes

- ~~Rewrite the `feed.xml` author/description to you.~~ Done, and while in
  there: added `language`, a real channel image, per-item descriptions,
  newest-first ordering, and absolute URLs inside item content (root-relative
  `src`/`href` resolved against the reader's origin, so the one article image
  and an internal link were broken in every RSS client).
- ~~Fix the four `<h1>`s in `reliable-http-file-uploads`.~~ Done: the intro
  is prose again, and the two statements became `##` headings split at the
  author's own colon / question mark, so no wording changed. Down to one
  `<h1>`. Two unrelated typos left alone in that file: "require" should be
  "requires" in the intro, and the second blockquote has a stray `> ` mid-line
  that renders literally.
- Delete or `noindex` `/uses` and `/speaking`.
- `noindex` the studio segment.
- Real `alt` text on the Ginti cascade diagram.
- `apple-touch-icon` + `site.webmanifest`, and drop the bogus favicon `sizes`.

### Step 7 — verify

- Google Search Console: add the property, submit the sitemap, request indexing
  for the seven articles.
- Bing Webmaster Tools (also feeds ChatGPT search).
- Paste one article URL into each of: X card validator, LinkedIn Post Inspector,
  and the Facebook sharing debugger — all three cache aggressively, so prime
  them once the OG tags are live.
- `curl -s <url> | grep -E 'og:|twitter:|canonical'` as a cheap regression check.

---

## Effort

| Step | Effort |
| --- | --- |
| 1. `metadataBase` + root metadata | done |
| 2. robots + sitemap | done |
| 3. shared article metadata helper | done |
| 4. generated OG images | done |
| 5. structured data | 45 min |
| 6. content fixes | 1 hr |
| 7. verification + Search Console | 30 min |

Steps 1, 2 and 6 alone would close most of the gap and could ship today.

---

## Explicitly out of scope

Keyword research, internal-linking strategy, tag/category archive pages,
pagination, i18n/hreflang, an image CDN, and anything involving backlinks.
Worth revisiting once the basics are in and Search Console has a month of data.
