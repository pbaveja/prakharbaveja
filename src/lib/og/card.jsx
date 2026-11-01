// Shared renderer for every Open Graph card on the site.
//
// One fixed frame (paper plate, hard ink shadow, shell-prompt top rail, blue
// accent rule) plus six interchangeable background plates, so a feed of posts
// doesn't look like six copies of the same image. The plate is picked from the
// slug, so a given article always gets the same card.
//
// Satori only implements a flexbox subset — no grid, no transforms — and it
// can't read fonts by family name, so the woff files are loaded as bytes.

const PAPER = '#F9F8F6'
const INK = '#111110'
const BLUE = '#2563eb' // matches text-blue-600, the site's accent on paper

/**
 * Faint ink linework. Motifs are drawn toward the right of their 560-wide
 * box so they sit beside the title rather than under it, and bleed off the
 * plate's right edge, which the frame clips.
 */
const LINE = { stroke: INK, strokeWidth: 3, fill: 'none', opacity: 0.11 }
const BOX = { ...LINE }
const INK_FILL = { fill: INK, opacity: 0.11 }
/** The one accent element per plate — soft enough to stay background. */
const ACCENT = { fill: BLUE, opacity: 0.26 }

function GridGuides() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <g {...LINE} strokeWidth="1.5" opacity="0.09">
        <path d="M170 60V450M250 60V450M330 60V450M410 60V450M490 60V450" />
        <path d="M140 130H560M140 210H560M140 290H560M140 370H560" />
      </g>
      <rect x="170" y="130" width="160" height="80" {...BOX} />
      <rect x="330" y="130" width="160" height="160" {...BOX} />
      <rect x="170" y="210" width="160" height="160" {...BOX} />
      <rect x="330" y="290" width="80" height="80" {...ACCENT} />
      <g {...LINE}>
        <path d="M170 410V430M330 410V430M490 410V430M170 420H490" />
      </g>
    </svg>
  )
}

function TerminalPane() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <rect x="150" y="130" width="400" height="300" {...BOX} />
      <path d="M150 180H550" {...LINE} />
      <g {...INK_FILL}>
        <circle cx="178" cy="155" r="7" />
        <circle cx="202" cy="155" r="7" />
        <circle cx="226" cy="155" r="7" />
      </g>
      <g {...INK_FILL}>
        <rect x="180" y="214" width="240" height="10" rx="4" />
        <rect x="180" y="248" width="160" height="10" rx="4" />
        <rect x="180" y="282" width="290" height="10" rx="4" />
        <rect x="180" y="316" width="120" height="10" rx="4" />
        <rect x="180" y="350" width="210" height="10" rx="4" />
      </g>
      <rect x="180" y="382" width="26" height="24" {...ACCENT} />
    </svg>
  )
}

function StackedCards() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <rect x="150" y="300" width="290" height="110" {...BOX} />
      <rect x="192" y="250" width="290" height="110" fill={PAPER} {...BOX} />
      <rect x="234" y="200" width="290" height="110" fill={PAPER} />
      <rect x="234" y="200" width="290" height="110" {...BOX} />
      <rect x="258" y="228" width="140" height="20" {...ACCENT} />
      <rect x="258" y="262" width="90" height="20" fill={INK} opacity="0.09" />
    </svg>
  )
}

function FlowNodes() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <rect x="150" y="140" width="150" height="76" {...BOX} />
      <rect x="360" y="300" width="150" height="76" {...BOX} />
      <rect x="190" y="420" width="150" height="76" {...BOX} />
      <g {...LINE}>
        <path d="M300 178H360V296" />
        <path d="M360 338H265V416" />
        <path d="M510 338H560" />
      </g>
      <rect x="360" y="140" width="110" height="76" {...ACCENT} />
    </svg>
  )
}

function Signal() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <g {...INK_FILL}>
        <circle cx="168" cy="404" r="7" />
        <circle cx="214" cy="372" r="7" />
        <circle cx="252" cy="396" r="7" />
        <circle cx="300" cy="334" r="7" />
        <circle cx="348" cy="352" r="7" />
        <circle cx="394" cy="290" r="7" />
        <circle cx="444" cy="306" r="7" />
        <circle cx="196" cy="438" r="7" />
        <circle cx="330" cy="398" r="7" />
        <circle cx="422" cy="350" r="7" />
        <circle cx="486" cy="268" r="7" />
      </g>
      <path
        d="M150 446L214 388L300 346L380 306L444 288L530 224"
        stroke={INK}
        strokeWidth="4"
        fill="none"
        opacity="0.14"
      />
      <circle cx="530" cy="224" r="17" {...ACCENT} />
    </svg>
  )
}

function CodeFold() {
  return (
    <svg width="560" height="554" viewBox="0 0 560 554">
      <g {...LINE} strokeWidth="1.5" opacity="0.09">
        <path d="M166 150V430M206 180V400M246 210V340" />
      </g>
      <g {...INK_FILL}>
        <rect x="180" y="150" width="250" height="10" rx="4" />
        <rect x="220" y="188" width="200" height="10" rx="4" />
        <rect x="260" y="226" width="160" height="10" rx="4" />
        <rect x="260" y="264" width="230" height="10" rx="4" />
        <rect x="220" y="340" width="130" height="10" rx="4" />
        <rect x="180" y="378" width="270" height="10" rx="4" />
        <rect x="180" y="420" width="190" height="10" rx="4" />
      </g>
      <rect x="260" y="300" width="140" height="22" {...ACCENT} />
    </svg>
  )
}

const PLATES = [
  GridGuides,
  TerminalPane,
  StackedCards,
  FlowNodes,
  Signal,
  CodeFold,
]

export const PLATE_NAMES = [
  'grid-and-guides',
  'terminal-pane',
  'stacked-cards',
  'flow-nodes',
  'signal',
  'code-fold',
]

/**
 * Deterministic plate for a slug, so an article's card never changes between
 * deploys. FNV-1a, which is plenty for spreading seven slugs across six plates.
 */
export function plateForSlug(slug) {
  let hash = 0x811c9dc5

  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return hash % PLATES.length
}

const FONT_DIR = 'src/lib/og/fonts'

/**
 * Satori can't resolve `font-family` names, so the woff bytes get passed in.
 * Read straight off disk: every route that calls this is prerendered at build
 * time, where the source tree is still there (it isn't inside a Vercel
 * function). Note woff, not woff2 — Satori doesn't decode woff2.
 */
export async function loadFonts() {
  let { readFile } = await import('node:fs/promises')
  let { join } = await import('node:path')

  let [regular, extrabold] = await Promise.all([
    readFile(
      join(process.cwd(), FONT_DIR, 'jetbrains-mono-latin-400-normal.woff'),
    ),
    readFile(
      join(process.cwd(), FONT_DIR, 'jetbrains-mono-latin-800-normal.woff'),
    ),
  ])

  return [
    { name: 'JetBrains Mono', data: regular, weight: 400, style: 'normal' },
    { name: 'JetBrains Mono', data: extrabold, weight: 800, style: 'normal' },
  ]
}

/**
 * The homepage avatar, inlined as a data URI: Satori can't fetch remote
 * images, and this is the light-theme file the header itself uses (the card is
 * always rendered on paper, so the dark variant never applies).
 */
export async function loadAvatar() {
  let { readFile } = await import('node:fs/promises')
  let { join } = await import('node:path')

  let bytes = await readFile(
    join(process.cwd(), 'src/images/avatarPrakharSmall.jpeg'),
  )

  return `data:image/jpeg;base64,${bytes.toString('base64')}`
}

/** Per-step opacity decay across the avatar run. */
const FADE = 0.48

/**
 * A run of the header's avatar square, bordered and hard-shadowed exactly like
 * AvatarContainer, fading out across the row. Stands in for a title on cards
 * that don't need one.
 */
export function AvatarStrip({ src, count = 6, size = 104 }) {
  return (
    // marginBottom clears the squares' hard shadow before the accent rule.
    <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            width: size,
            height: size,
            padding: 4,
            background: PAPER,
            border: `2px solid ${INK}`,
            boxShadow: `6px 6px 0 0 ${INK}`,
            // Steep geometric falloff, so the run reads as continuing rather
            // than as a set of six: 1, .48, .23, .11, .053, .025.
            opacity: FADE ** index,
          }}
        >
          {/* Satori rasterizes this, so next/image can't apply and alt text
              never reaches a reader. */}
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img
            src={src}
            width={size - 12}
            height={size - 12}
            style={{ objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Titles are set as large as they'll go without spilling past three lines.
 * Monospace makes this predictable: ~0.6em per character, over a 820px box.
 */
function titleSize(title) {
  if (title.length <= 38) return 68
  if (title.length <= 72) return 58
  return 48
}

export const SIZE = { width: 1200, height: 630 }

/**
 * The card itself. `eyebrow` is the shell-prompt path in the top rail,
 * `footer` the line under the accent rule (a date, usually). `art` replaces
 * the title outright, for cards where the top rail already says who this is;
 * such a card brings its own artwork, so `plate` can be null to drop the
 * background motif rather than have the two compete for the same space.
 */
export function Card({ title, eyebrow, footer, art, plate = 0 }) {
  let Plate = plate === null ? null : PLATES[plate % PLATES.length]

  return (
    <div
      style={{
        width: SIZE.width,
        height: SIZE.height,
        display: 'flex',
        position: 'relative',
        background: PAPER,
        fontFamily: 'JetBrains Mono',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 44,
          width: 1128,
          height: 558,
          background: INK,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 36,
          width: 1128,
          height: 558,
          display: 'flex',
          background: PAPER,
          border: `2px solid ${INK}`,
          overflow: 'hidden',
        }}
      >
        {Plate && (
          <div
            style={{ position: 'absolute', right: 0, top: 0, display: 'flex' }}
          >
            <Plate />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '44px 52px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{ fontSize: 26, color: 'rgba(17,17,16,0.55)' }}
            >{`$ ${eyebrow}`}</span>
            <div
              style={{
                width: 15,
                height: 30,
                marginLeft: 14,
                background: BLUE,
              }}
            />
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}
          >
            {art ?? (
              <div
                style={{
                  display: 'flex',
                  fontSize: titleSize(title),
                  fontWeight: 800,
                  lineHeight: 1.14,
                  letterSpacing: '-0.02em',
                  color: INK,
                }}
              >
                {title}
              </div>
            )}
            <div
              style={{ width: 72, height: 7, marginTop: 30, background: BLUE }}
            />
          </div>
          <span style={{ fontSize: 26, color: 'rgba(17,17,16,0.45)' }}>
            {footer}
          </span>
        </div>
      </div>
    </div>
  )
}
