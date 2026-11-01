# Share Previews — "Terminal Plates"

The Open Graph cards for `prakharbaveja.com`, built from the site's own design
language rather than a generic template. **Shipped** — this documents what's in
the repo, not a proposal.

---

## The design language it borrows from

From [tailwind.config.js](../tailwind.config.js) and the homepage:

| Token | Value | Where it comes from |
| --- | --- | --- |
| `paper` | `#F9F8F6` | page background |
| `ink` | `#111110` | text, borders |
| accent | `#2563eb` | `text-blue-600` — the `$` prompt, links, nav |
| Type | JetBrains Mono | everything, headings included |
| Shadow | `4px 4px 0 0` | hard, no blur |
| Border | 2px solid black | — |

House style: neo-brutalist, monospace, terminal-adjacent, high contrast, one
accent colour. The cards are unmistakably from the same site — someone who's
read one article should recognise the next one in a feed before reading the
title.

---

## The design

**One fixed frame. Six interchangeable background plates.**

The frame never changes, so every card is recognisable. The plate changes per
article, so a feed of five posts doesn't look like five copies of one image. The
plate is picked deterministically from the slug, so a given article always gets
the same card — no randomness, nothing to pick by hand, and a new article gets a
card the moment it's published.

### The frame (constant)

1200 × 630, `paper` ground.

- **Plate**: 2px ink border inset 36px, with an 8px hard offset shadow.
- **Top rail**: `$ prakharbaveja.com/articles` in 26px mono at 55% ink,
  followed by a solid blue block cursor. This is the brand mark — no logo, no
  avatar. The domain does the identifying.
- **Title**: left-aligned, JetBrains Mono ExtraBold, `-0.02em` tracking, ink.
  Auto-sized by length — 68px to 38 chars, 58px to 72, 48px beyond — wrapping
  inside a 760px box. The `art` slot can replace it outright: the site card
  uses that to repeat the header's avatar square six times, fading steeply
  (1, .48, .23, .11, .05, .025) so the run reads as continuing rather than as
  a set of six, instead of spelling out a name the top rail already gives.
  That card passes `plate={null}` — it brings its own artwork, and the two
  would otherwise compete for the same band.
- **Rule**: a 72 × 7 blue bar under the title. The one spot of colour that's
  always present.
- **Footer**: the publish date, 26px mono at 45% ink.
- **Plate motif**: drawn toward the right of its box so it sits beside the
  title rather than under it, bleeding off the plate's right edge (clipped by
  the frame). Ink linework at 11%, the single accent element at 26%.

### The six plates

Pure SVG, drawn in the same vocabulary as the site's existing diagrams.

| # | Name | Motif | Fits |
| --- | --- | --- | --- |
| 0 | Grid and guides | Wireframe boxes over a baseline grid, with measure ticks | Design, craft, product |
| 1 | Terminal pane | Window chrome with three dots and faint scrollback | Tooling, workflow, shell |
| 2 | Stacked cards | Three offset bordered rects receding up-right | Architecture, layers |
| 3 | Flow nodes | Boxes joined by right-angle connectors | Pipelines, how-it-works |
| 4 | Signal | A dot scatter resolving into a sparkline | Data, evaluation, ML |
| 5 | Code fold | Indent guides and collapsed line runs | Code-heavy posts |

Exactly one element per plate is blue — one grid cell, the terminal cursor, one
card in the stack, one node, the final data point, one folded line. It gives
each plate a focal point and keeps the accent doing real work.

### Assignment

`plateForSlug()` — FNV-1a over the slug, modulo six. The current seven posts
land on five different plates, so the articles index reads as a varied set.

To pin a specific plate, pass `plate` directly in the route; there's no
per-article override key yet because nothing has needed one.

---

## How it's built

| File | Role |
| --- | --- |
| [src/lib/og/card.jsx](../src/lib/og/card.jsx) | Frame, six plates, font loader, slug→plate hash |
| [src/app/og/articles/[slug]/route.js](../src/app/og/articles/%5Bslug%5D/route.js) | Per-article card |
| [src/app/opengraph-image.js](../src/app/opengraph-image.js) | Site-wide card (avatar strip, grid and guides) |
| [src/app/articles/opengraph-image.js](../src/app/articles/opengraph-image.js) | Articles index (stacked cards) |
| [src/app/projects/opengraph-image.js](../src/app/projects/opengraph-image.js) | Projects (flow nodes) |
| [src/lib/articleMetadata.js](../src/lib/articleMetadata.js) | Canonical + OG + Twitter tags per article |

All ten images are prerendered at build time as 1200 × 630 PNGs, ~36–40 KB
each. Nothing renders at request time, so there's no runtime cost and no
cold-start risk.

### Three things that had to be worked around

**Articles aren't a dynamic route.** They're static folders
(`src/app/articles/<slug>/page.mdx`), so a static segment shadows any
`[slug]/opengraph-image.js` sibling. Hence a route handler on its own path,
`/og/articles/<slug>`, with `generateStaticParams` + `force-static`. Articles
point at it through `openGraph.images`, which overrides the inherited site card.

**MDX isn't on disk inside a Vercel function.** The handler reads the article
list via `getAllArticles()`, which globs the source tree — fine at build time,
impossible at runtime. `force-static` + `dynamicParams = false` keeps it to
build time.

**Images can't be fetched either.** The avatar is read off disk and inlined as
a base64 data URI — the light-theme file the header itself uses, since the card
is always rendered on paper. The `<img>` needs an eslint-disable: `next/image`
can't run inside Satori, and alt text never survives rasterization.

**Fonts can't be fetched.** Satori resolves fonts from bytes, not family names,
and webpack rewrites `new URL('./x.woff', import.meta.url)` into an asset path
that `fetch` can't parse. The woff files are read off disk instead, during the
same build-time pass. Note woff, not woff2 — Satori doesn't decode woff2.

### Metadata wiring

Articles no longer hand-roll their `metadata` export. Each one is now:

```js
export const metadata = articleMetadata(article, 'enter-jev-a-system-one-model')
```

which emits the title, description, canonical URL, OG tags (including
`publishedTime` and `authors`) and the Twitter card together.
`buildArticleFile` emits exactly that line, so every Studio publish gets correct
tags by construction rather than drifting. The root layout sets `metadataBase`,
so all of it can be written as plain paths.

### Light only, deliberately

Preview cards are rendered by the sharing platform, not the viewer's browser, so
`prefers-color-scheme` never reaches them. A dark variant would be wasted work.

---

## If you want bespoke cards later

The frame supports it: add an optional `image` key to an article's metadata and
let it override the generated card. Worth it for a post whose diagram is the
hook — the Ginti cascade, say. Generated cards stay the default.
