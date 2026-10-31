# Diagrams

Articles draw diagrams with the `<Diagram>` component, registered globally in
`mdx-components.jsx` — no import needed in the MDX:

```mdx
<Diagram data={{ nodes: [{ id: 'a', x: 120, y: 100, label: 'Phone' }] }} />
```

It renders a themed SVG that follows the blog's look in both light and dark
mode. There are two ways to author one:

- **The studio builder.** In `/studio`, the "Insert diagram" toolbar button
  opens a WYSIWYG canvas: drag boxes, drag their corner to resize, draw
  arrows, and it writes the `<Diagram data={...} />` JSON into the article.
  The preview on that canvas is the real component, so what you drag is what
  publishes.
- **By hand**, writing the JSON below. Worth it for a diagram ported from an
  existing SVG, where you already have coordinates.

Everything is laid out by `src/lib/diagramLayout.js`, which is unit tested in
`src/lib/diagramLayout.test.js`.

## The shape of `data`

| Key | Default | What it does |
| --- | --- | --- |
| `width`, `height` | `800`, `450` | The viewBox. The canvas, not the rendered size. |
| `minWidth` | `900` once `width > 900` | Below this the diagram scrolls sideways instead of shrinking. `0` switches that off. |
| `caption` | — | Rendered as a `<figcaption>` under the diagram. |
| `alt` | falls back to `caption` | The SVG's accessible label. |
| `groups` | `[]` | Dashed background panels. |
| `nodes` | `[]` | The boxes. |
| `edges` | `[]` | The arrows. |
| `legend` | — | An in-canvas key. |

### Nodes

| Key | What it does |
| --- | --- |
| `id` | Required, and what edges refer to. |
| `x`, `y` | The box's **center**. |
| `left`, `top` | The top-left corner, as an alternative to `x`/`y` — easier when porting from an SVG. `x`/`y` win if you give both. |
| `w`, `h` | Size. Leave `h` off and the box sizes itself around its content. |
| `label` | The title, in bold. Wraps. |
| `sublabel` | A dimmer line under the title. |
| `lines` | Body lines, left-aligned. Each wraps. |
| `children` | Inner boxes, stacked automatically — `[{ label, state? }]`. |
| `role` | What the box *is*; see below. |
| `state` | `'later'` draws it dashed, for things not built yet. |
| `detail` | Longer prose, revealed in a panel when a reader clicks the box. Boxes with a detail get a small dot and are keyboard-focusable. |

Prefer `role` over the older `color`. A role says what a box means and picks
up the blog's palette in both themes, so diagrams stay consistent with each
other:

| Role | Reads as |
| --- | --- |
| `own` | The reader's own device or data |
| `service` | Something you run |
| `store` | Storage |
| `vendor` | A third party |
| `grey` | Neutral |

The old `color` values (`grey`, `yellow`, `blue`, `green`) still work.

### Edges

| Key | What it does |
| --- | --- |
| `id`, `from`, `to` | Required. `from`/`to` are node ids. |
| `label` | Sits above a horizontal arrow, beside a vertical one. `labelDx`/`labelDy` nudge it. |
| `fromSide`, `toSide` | `left`, `right`, `top` or `bottom`. Omit and the arrow runs center to center, exiting each box at its border. |
| `fromAt`, `toAt` | `0`–`1` along that side, so an arrow can meet a tall box at the right height. Fractions, so they survive the box being resized. |
| `both` | An arrowhead at each end. |
| `state` | `'later'` draws it dashed. |

Arrows between the same pair of boxes fan apart automatically — unless they
name their own sides, in which case you're placing them deliberately and they
are left alone.

### Groups and the legend

A group is a labelled dashed panel: `{ id, left, top, w, h, label }`. It is
decoration — boxes don't belong to one, they just sit inside it.

A legend sizes itself around its entries:

```js
legend: {
  left: 800, top: 20, w: 300,
  entries: [
    { role: 'own', label: 'Yours' },
    { state: 'later', label: 'Arrives in a later milestone' },
  ],
}
```

## Things that will bite you

- **Leave `h` off.** A box with a subtitle, body lines or inner boxes computes
  its own height. Pinning `h` smaller than the content clips it.
- **A panel label needs ~30px of clearance.** It's drawn 22px below the
  panel's top edge, so the first box inside wants to start at least 30px down,
  or the label lands on it.
- **Text is measured, not guessed, but only for monospace.** The blog is
  JetBrains Mono throughout, and the SVG pins `font-sans` so this holds even
  inside `not-prose`. Wrapping assumes that advance width.
- **Wide diagrams scroll.** The prose column is 672px. Anything past 900px
  wide gets a sideways scroll and a hint under the caption, because scaling it
  down instead would shrink the labels past reading.
- **Check the studio warnings.** The builder flags duplicate ids, dangling
  arrows, unknown roles and boxes that fall off the canvas.

## A worked example

This is a full data-flow diagram — panels, roles, inner boxes, side-anchored
arrows, dashed future work, a legend and click-through detail:

```jsx
<Diagram
  data={{{
      "width": 1120,
      "height": 740,
      "caption": "Readable data stays on the phone. Everything that leaves it is redacted or encrypted, passes FastAPI's redaction gate, and is stored in Mumbai. The model vendors see only the minimal redacted text each request needs, and never a user id.",
      "legend": {
        "left": 800,
        "top": 20,
        "w": 300,
        "entries": [
          {
            "role": "own",
            "label": "Yours"
          },
          {
            "role": "service",
            "label": "Ginti's server"
          },
          {
            "role": "store",
            "label": "Ginti's storage"
          },
          {
            "role": "vendor",
            "label": "Outside model vendors"
          },
          {
            "state": "later",
            "label": "Arrives in a later milestone"
          }
        ]
      },
      "groups": [
        {
          "id": "devices",
          "left": 20,
          "top": 40,
          "w": 300,
          "h": 680,
          "label": "Your devices"
        },
        {
          "id": "server",
          "left": 400,
          "top": 40,
          "w": 320,
          "h": 680,
          "label": "Ginti's server, Mumbai"
        },
        {
          "id": "vendors",
          "left": 800,
          "top": 170,
          "w": 300,
          "h": 280,
          "label": "Model vendors, from M6"
        },
        {
          "id": "storage",
          "left": 800,
          "top": 470,
          "w": 300,
          "h": 250,
          "label": "Ginti's storage, Mumbai"
        }
      ],
      "nodes": [
        {
          "id": "phone",
          "left": 40,
          "top": 90,
          "w": 260,
          "role": "own",
          "label": "Ginti on your phone",
          "sublabel": "Offline first, M0 to M5",
          "lines": [
            "Reads SMS and payment alerts",
            "Parses, redacts, sorts tiers 1-6",
            "Encrypted database on phone",
            "Readable text never leaves"
          ],
          "children": [
            {
              "label": "On-device models \u00b7 M11, M12",
              "state": "later"
            }
          ],
          "detail": "Everything readable lives here and nowhere else. The phone parses each message, strips identifiers, and keeps the full text in an encrypted database it never uploads."
        },
        {
          "id": "blockstore",
          "left": 40,
          "top": 340,
          "w": 260,
          "role": "own",
          "label": "Google Block Store",
          "sublabel": "Encrypted recovery secret"
        },
        {
          "id": "laptop",
          "left": 40,
          "top": 440,
          "w": 260,
          "role": "own",
          "label": "Your laptop",
          "sublabel": "Signs files, holds backup key"
        },
        {
          "id": "webapp",
          "left": 40,
          "top": 560,
          "w": 260,
          "role": "own",
          "state": "later",
          "label": "Web app \u00b7 M9",
          "sublabel": "Bulk review in a browser"
        },
        {
          "id": "auth",
          "left": 420,
          "top": 90,
          "w": 280,
          "role": "service",
          "label": "Supabase Auth",
          "sublabel": "Sign-in for phone and web"
        },
        {
          "id": "api",
          "left": 420,
          "top": 200,
          "w": 280,
          "h": 430,
          "role": "service",
          "label": "FastAPI on Cloud Run",
          "sublabel": "The only door to your data",
          "children": [
            {
              "label": "Redaction gate"
            },
            {
              "label": "Sync: push and pull"
            },
            {
              "label": "Signed data files"
            },
            {
              "label": "Server tiers 7 and 8 \u00b7 M6",
              "state": "later"
            },
            {
              "label": "Read and bulk endpoints \u00b7 M9",
              "state": "later"
            },
            {
              "label": "Questions to queries \u00b7 M10",
              "state": "later"
            },
            {
              "label": "Signed model files \u00b7 M8+",
              "state": "later"
            }
          ],
          "detail": "Every request from a phone or browser arrives here. The redaction gate refuses anything that isn't sync-profile text, so unredacted data can't be stored even by mistake."
        },
        {
          "id": "jev",
          "left": 820,
          "top": 210,
          "w": 260,
          "role": "vendor",
          "state": "later",
          "label": "Jev 1.13.0 \u00b7 TypeSafe",
          "sublabel": "Closed-set labels \u00b7 M6",
          "lines": [
            "Zero data retention"
          ]
        },
        {
          "id": "gemini",
          "left": 820,
          "top": 320,
          "w": 260,
          "role": "vendor",
          "state": "later",
          "label": "Gemini 3.8 Flash \u00b7 Google",
          "sublabel": "Fills missing fields \u00b7 M6",
          "lines": [
            "Merchant lookups, Search \u00b7 M6",
            "Questions in words \u00b7 M10"
          ]
        },
        {
          "id": "postgres",
          "left": 820,
          "top": 520,
          "w": 260,
          "role": "store",
          "label": "Supabase Postgres",
          "sublabel": "Redacted copy, ciphertext"
        },
        {
          "id": "backups",
          "left": 820,
          "top": 630,
          "w": 260,
          "role": "store",
          "label": "Backup bucket",
          "sublabel": "age-encrypted, 30 days kept"
        }
      ],
      "edges": [
        {
          "id": "e-signin",
          "from": "phone",
          "to": "auth",
          "label": "sign in",
          "fromSide": "right",
          "fromAt": 0.14,
          "toSide": "left",
          "toAt": 0.48
        },
        {
          "id": "e-sync",
          "from": "phone",
          "to": "api",
          "label": "sync",
          "both": true,
          "fromSide": "right",
          "fromAt": 0.68,
          "toSide": "left",
          "toAt": 0.084
        },
        {
          "id": "e-files",
          "from": "api",
          "to": "phone",
          "label": "signed files",
          "fromSide": "left",
          "fromAt": 0.186,
          "toSide": "right",
          "toAt": 0.89
        },
        {
          "id": "e-tokens",
          "from": "auth",
          "to": "api",
          "label": "token keys",
          "fromSide": "bottom",
          "toSide": "top"
        },
        {
          "id": "e-deploy",
          "from": "laptop",
          "to": "api",
          "label": "deploys, signs",
          "fromSide": "right",
          "toSide": "left",
          "toAt": 0.633
        },
        {
          "id": "e-secret",
          "from": "phone",
          "to": "blockstore",
          "label": "secret",
          "fromSide": "bottom",
          "fromAt": 0.5,
          "toSide": "top"
        },
        {
          "id": "e-web",
          "from": "webapp",
          "to": "api",
          "label": "read, edit",
          "both": true,
          "state": "later",
          "fromSide": "right",
          "toSide": "left",
          "toAt": 0.912
        },
        {
          "id": "e-jev",
          "from": "api",
          "to": "jev",
          "label": "sync text",
          "state": "later",
          "fromSide": "right",
          "fromAt": 0.116,
          "toSide": "left"
        },
        {
          "id": "e-gemini",
          "from": "api",
          "to": "gemini",
          "label": "minimal",
          "state": "later",
          "fromSide": "right",
          "fromAt": 0.4,
          "toSide": "left"
        },
        {
          "id": "e-stores",
          "from": "api",
          "to": "postgres",
          "label": "stores",
          "fromSide": "right",
          "fromAt": 0.819,
          "toSide": "left"
        },
        {
          "id": "e-backup",
          "from": "postgres",
          "to": "backups",
          "label": "nightly, encrypted",
          "fromSide": "bottom",
          "toSide": "top"
        }
      ]
    }}}
/>
```
