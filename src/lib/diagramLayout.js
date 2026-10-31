// Pure geometry and style tables for the <Diagram> component. Deliberately
// JSX-free and side-effect-free so it can be unit tested under vitest's
// `node` environment, and imported by both the client component and the
// server-side studio preview.

export const DEFAULT_WIDTH = 800
export const DEFAULT_HEIGHT = 450

// Fallback node size. A node that sets neither `w`/`h` nor any extra content
// keeps exactly these dimensions, so diagrams authored before the schema was
// extended render identically.
export const NODE_WIDTH = 140
export const NODE_HEIGHT = 56

// Beyond this canvas width the diagram can no longer shrink to the article's
// prose column (max-w-2xl, 672px) without the text becoming illegible, so the
// wrapper scrolls sideways instead of scaling down.
export const SCROLL_THRESHOLD = 900
export const DEFAULT_MIN_WIDTH = 900

export const NODE_PAD_X = 14
const NODE_PAD_TOP = 12
const NODE_PAD_BOTTOM = 12
const TITLE_LINE_H = 20
const SUB_LINE_H = 18
const BODY_LINE_H = 18
const CHILD_HEIGHT = 38
const CHILD_GAP = 8
const CHILD_PAD_TOP = 6

export const FONT_SIZE = {
  title: 13.5,
  sublabel: 11.5,
  body: 12,
  child: 12,
  groupLabel: 11.5,
  edgeLabel: 11,
  legend: 11.5,
}

// Everything in this repo renders in JetBrains Mono, so a single advance
// width predicts text extents accurately enough to wrap without measuring.
const MONO_ADVANCE = 0.6

// A small gap beyond the node's true border so the line/arrowhead doesn't
// visually merge with the node's own stroke.
const EDGE_GAP = 3

// Offset, in px, between edges that connect the same pair of nodes, so
// parallel connections fan out instead of drawing exactly on top of
// each other. Only applied to edges that don't name their own anchor sides.
const PARALLEL_EDGE_SPACING = 14

// Node fills. The first four keys are the original `color` values and keep
// their exact appearance; the rest are semantic roles, which is what new
// diagrams should use — an article picks what a box *means* and inherits the
// blog's palette automatically, in both themes.
export const NODE_STYLES = {
  grey: {
    label: 'Grey',
    swatch: '#F9F8F6',
    fill: 'fill-paper dark:fill-zinc-800',
    text: 'fill-zinc-900 dark:fill-zinc-100',
  },
  yellow: {
    label: 'Yellow',
    swatch: '#FFE600',
    fill: 'fill-highlight dark:fill-highlight',
    text: 'fill-zinc-900',
  },
  blue: {
    label: 'Blue',
    swatch: '#7DD3FC',
    fill: 'fill-sky-300 dark:fill-sky-400',
    text: 'fill-zinc-900',
  },
  green: {
    label: 'Green',
    swatch: '#6EE7B7',
    fill: 'fill-emerald-300 dark:fill-emerald-400',
    text: 'fill-zinc-900',
  },
  own: {
    label: 'Yours',
    swatch: '#FFF59A',
    fill: 'fill-yellow-200 dark:fill-yellow-300',
    text: 'fill-zinc-900',
  },
  service: {
    label: 'Your server',
    swatch: '#BAE6FD',
    fill: 'fill-sky-200 dark:fill-sky-300',
    text: 'fill-zinc-900',
  },
  vendor: {
    label: 'Outside vendor',
    swatch: '#FED7AA',
    fill: 'fill-orange-200 dark:fill-orange-300',
    text: 'fill-zinc-900',
  },
  store: {
    label: 'Storage',
    swatch: '#A7F3D0',
    fill: 'fill-emerald-200 dark:fill-emerald-300',
    text: 'fill-zinc-900',
  },
}

export const ROLE_ORDER = ['own', 'service', 'vendor', 'store', 'grey']
export const LEGACY_COLOR_ORDER = ['grey', 'yellow', 'blue', 'green']

export function nodeStyle(node) {
  return NODE_STYLES[node?.role] || NODE_STYLES[node?.color] || NODE_STYLES.grey
}

/** True for anything marked as not-yet-built, which renders dashed. */
export function isLater(item) {
  return item?.state === 'later'
}

export function canvasSize(data) {
  return {
    width: data?.width ?? DEFAULT_WIDTH,
    height: data?.height ?? DEFAULT_HEIGHT,
  }
}

/**
 * The pixel width below which the diagram should scroll rather than shrink.
 * Null means "always fits" — which is what every pre-existing 800px diagram
 * gets, so none of them start scrolling because of this change.
 */
export function scrollMinWidth(data) {
  if (data?.minWidth !== undefined) return data.minWidth || null
  let { width } = canvasSize(data)
  return width > SCROLL_THRESHOLD ? DEFAULT_MIN_WIDTH : null
}

/**
 * Resolves a box that may be given either by its center (`x`/`y`, how nodes
 * have always been positioned and how the builder drags them) or by its
 * top-left corner (`left`/`top`, which is what hand-porting an existing SVG
 * gives you). `x`/`y` win if both are present.
 */
export function resolveBox(item, fallbackWidth = NODE_WIDTH, fallbackHeight = NODE_HEIGHT) {
  let w = item?.w ?? fallbackWidth
  let h = item?.h ?? fallbackHeight
  let cx = item?.x ?? (item?.left ?? 0) + w / 2
  let cy = item?.y ?? (item?.top ?? 0) + h / 2

  return { cx, cy, w, h, left: cx - w / 2, top: cy - h / 2 }
}

/** How many monospace characters fit across `width`, inside `padX` padding. */
export function charBudget(width, fontSize, padX = NODE_PAD_X) {
  return Math.max(1, Math.floor((width - padX * 2) / (fontSize * MONO_ADVANCE)))
}

/**
 * Greedy word wrap, honouring explicit newlines first. SVG text has no
 * wrapping of its own, so without this a long label silently overflows its
 * box — the single most common way a hand-written diagram goes wrong.
 */
export function wrapText(text, maxChars) {
  if (text === null || text === undefined || text === '') return []

  let out = []
  for (let paragraph of String(text).split('\n')) {
    let words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      out.push('')
      continue
    }

    let current = ''
    for (let word of words) {
      if (!current) {
        current = word
      } else if (current.length + 1 + word.length <= maxChars) {
        current += ' ' + word
      } else {
        out.push(current)
        current = word
      }
    }
    out.push(current)
  }

  return out
}

/**
 * Lays out one node: wraps its text, stacks title / sublabel / body lines /
 * child boxes, and derives a height when the node doesn't declare one.
 *
 * A node carrying nothing but a `label` takes the "simple" path and renders a
 * single vertically-centered line, which is exactly what the original
 * component did.
 */
export function nodeLayout(node) {
  let hasChildren = Array.isArray(node.children) && node.children.length > 0
  let hasBody = Boolean(node.sublabel) || Boolean(node.lines?.length) || hasChildren

  let width = node.w ?? NODE_WIDTH
  let titleLines = wrapText(node.label, charBudget(width, FONT_SIZE.title))

  if (!hasBody) {
    let box = resolveBox(node, NODE_WIDTH, NODE_HEIGHT)
    // Multi-line labels still need the box to grow, even on the simple path.
    let needed = titleLines.length * TITLE_LINE_H + NODE_PAD_TOP + NODE_PAD_BOTTOM
    let height = node.h ?? Math.max(NODE_HEIGHT, titleLines.length > 1 ? needed : NODE_HEIGHT)
    box = resolveBox(node, width, height)

    return {
      box,
      simple: true,
      title: titleLines.map((text, index) => ({
        text,
        x: box.cx,
        y: box.top + box.h / 2 - ((titleLines.length - 1) * TITLE_LINE_H) / 2 + index * TITLE_LINE_H,
      })),
      sublabel: [],
      lines: [],
      children: [],
      measuredHeight: height,
    }
  }

  let subLines = wrapText(node.sublabel, charBudget(width, FONT_SIZE.sublabel))
  let bodyLines = (node.lines || []).flatMap((line) =>
    wrapText(line, charBudget(width, FONT_SIZE.body)),
  )
  let children = hasChildren ? node.children : []

  let contentHeight =
    NODE_PAD_TOP +
    titleLines.length * TITLE_LINE_H +
    subLines.length * SUB_LINE_H +
    bodyLines.length * BODY_LINE_H +
    (children.length > 0
      ? CHILD_PAD_TOP +
        children.reduce((sum, child) => sum + (child.h ?? CHILD_HEIGHT), 0) +
        (children.length - 1) * CHILD_GAP
      : 0) +
    NODE_PAD_BOTTOM

  let height = node.h ?? Math.max(NODE_HEIGHT, contentHeight)
  let box = resolveBox(node, width, height)

  let cursor = box.top + NODE_PAD_TOP
  let title = titleLines.map((text) => {
    let y = cursor + TITLE_LINE_H * 0.7
    cursor += TITLE_LINE_H
    return { text, x: box.cx, y }
  })

  let sublabel = subLines.map((text) => {
    let y = cursor + SUB_LINE_H * 0.7
    cursor += SUB_LINE_H
    return { text, x: box.cx, y }
  })

  let lines = bodyLines.map((text) => {
    let y = cursor + BODY_LINE_H * 0.7
    cursor += BODY_LINE_H
    return { text, x: box.left + NODE_PAD_X, y }
  })

  if (children.length > 0) cursor += CHILD_PAD_TOP

  let laidOutChildren = children.map((child, index) => {
    let childHeight = child.h ?? CHILD_HEIGHT
    let top = cursor
    cursor += childHeight + CHILD_GAP

    return {
      ...child,
      key: child.id ?? `${node.id}-child-${index}`,
      left: box.left + NODE_PAD_X,
      top,
      w: box.w - NODE_PAD_X * 2,
      h: childHeight,
      textX: box.cx,
      textY: top + childHeight / 2,
    }
  })

  return { box, simple: false, title, sublabel, lines, children: laidOutChildren, measuredHeight: height }
}

/** Builds the id → laid-out-node map every other helper works from. */
export function layoutNodes(nodes = []) {
  let layouts = {}
  for (let node of nodes) layouts[node.id] = nodeLayout(node)
  return layouts
}

/** A point on one named face of a box, `at` being the fraction along it. */
export function anchorOn(box, side, at = 0.5) {
  let fraction = Math.min(Math.max(at, 0), 1)

  switch (side) {
    case 'left':
      return { x: box.left - EDGE_GAP, y: box.top + box.h * fraction }
    case 'right':
      return { x: box.left + box.w + EDGE_GAP, y: box.top + box.h * fraction }
    case 'top':
      return { x: box.left + box.w * fraction, y: box.top - EDGE_GAP }
    case 'bottom':
      return { x: box.left + box.w * fraction, y: box.top + box.h + EDGE_GAP }
    default:
      return null
  }
}

// Where a ray from a box's center in direction (dx, dy) exits the box —
// exact border intersection, not an ellipse approximation, so lines
// terminate flush with the node's edge instead of cutting into it.
export function rectBoundaryPoint(box, dx, dy) {
  if (dx === 0 && dy === 0) return { x: box.cx, y: box.cy }

  let halfWidth = box.w / 2 + EDGE_GAP
  let halfHeight = box.h / 2 + EDGE_GAP
  let t = Math.min(
    dx !== 0 ? halfWidth / Math.abs(dx) : Infinity,
    dy !== 0 ? halfHeight / Math.abs(dy) : Infinity,
  )

  return { x: box.cx + dx * t, y: box.cy + dy * t }
}

/**
 * Endpoints for one edge. An edge that names `fromSide`/`toSide` is anchored
 * to those faces (how the Ginti-style side-by-side flows are drawn); one that
 * doesn't falls back to the center-to-center ray exit used before.
 */
export function edgeGeometry(fromBox, toBox, edge = {}) {
  let explicit = Boolean(edge.fromSide || edge.toSide)
  let dx = toBox.cx - fromBox.cx
  let dy = toBox.cy - fromBox.cy

  let start = edge.fromSide
    ? anchorOn(fromBox, edge.fromSide, edge.fromAt ?? 0.5)
    : rectBoundaryPoint(fromBox, dx, dy)
  let end = edge.toSide
    ? anchorOn(toBox, edge.toSide, edge.toAt ?? 0.5)
    : rectBoundaryPoint(toBox, -dx, -dy)

  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, explicit }
}

/**
 * Groups edges that share the same (unordered) pair of endpoints, so
 * multiple connections between the same two nodes can be fanned out
 * instead of overlapping.
 */
export function groupParallelEdges(edges = []) {
  let groups = {}
  for (let edge of edges) {
    let key = [edge.from, edge.to].sort().join('|')
    if (!groups[key]) groups[key] = []
    groups[key].push(edge.id)
  }
  return groups
}

/** Shifts an edge perpendicular to itself, to fan out overlapping edges. */
export function offsetPerpendicular({ x1, y1, x2, y2 }, offset) {
  if (!offset) return { x1, y1, x2, y2 }

  let length = Math.hypot(x2 - x1, y2 - y1) || 1
  let perpX = (-(y2 - y1) / length) * offset
  let perpY = ((x2 - x1) / length) * offset

  return { x1: x1 + perpX, y1: y1 + perpY, x2: x2 + perpX, y2: y2 + perpY }
}

export function parallelOffset(group, edgeId) {
  if (!group || group.length < 2) return 0
  let index = group.indexOf(edgeId)
  return (index - (group.length - 1) / 2) * PARALLEL_EDGE_SPACING
}

/**
 * Where an edge's label sits: above the midpoint of a mostly-horizontal
 * line, beside a mostly-vertical one. `labelDx`/`labelDy` nudge it, for the
 * cases where a neighbouring box is in the way.
 */
export function edgeLabelPosition({ x1, y1, x2, y2 }, edge = {}) {
  let midX = (x1 + x2) / 2
  let midY = (y1 + y2) / 2
  let horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
  let dx = edge.labelDx ?? 0
  let dy = edge.labelDy ?? 0

  return horizontal
    ? { x: midX + dx, y: midY - 7 + dy, anchor: 'middle' }
    : { x: midX + 9 + dx, y: midY + dy, anchor: 'start' }
}

const GROUP_LABEL_INSET_X = 14
const GROUP_LABEL_INSET_Y = 22

export function groupLayout(group) {
  let box = resolveBox(group, 200, 120)

  return {
    box,
    label: group.label
      ? { text: group.label, x: box.left + GROUP_LABEL_INSET_X, y: box.top + GROUP_LABEL_INSET_Y }
      : null,
  }
}

const LEGEND_SWATCH_W = 24
const LEGEND_SWATCH_H = 13
const LEGEND_ROW_H = 23
const LEGEND_PAD = 14
const LEGEND_LABEL_GAP = 12

/**
 * Lays out an in-canvas key. The author lists entries; the box sizes itself,
 * so adding a role to a diagram never means recomputing a rectangle.
 */
export function legendLayout(legend) {
  if (!legend) return null

  let entries = legend.entries || []
  let width = legend.w ?? 280
  let height = legend.h ?? LEGEND_PAD * 2 + entries.length * LEGEND_ROW_H
  let box = resolveBox({ ...legend, w: width, h: height }, width, height)

  return {
    box,
    entries: entries.map((entry, index) => {
      let top = box.top + LEGEND_PAD + index * LEGEND_ROW_H

      return {
        ...entry,
        key: `${entry.role ?? entry.state ?? 'entry'}-${index}`,
        swatchX: box.left + LEGEND_PAD,
        swatchY: top,
        swatchW: LEGEND_SWATCH_W,
        swatchH: LEGEND_SWATCH_H,
        labelX: box.left + LEGEND_PAD + LEGEND_SWATCH_W + LEGEND_LABEL_GAP,
        labelY: top + LEGEND_SWATCH_H / 2,
      }
    }),
  }
}

/**
 * Non-fatal problems worth telling the author about: things that render but
 * almost certainly aren't what they meant. Surfaced in the studio builder,
 * never thrown, so a half-finished diagram still previews.
 */
export function diagramWarnings(data) {
  let warnings = []
  let nodes = data?.nodes || []
  let edges = data?.edges || []
  let { width, height } = canvasSize(data)

  let seen = new Set()
  for (let node of nodes) {
    if (!node.id) warnings.push('A node is missing an id.')
    else if (seen.has(node.id)) warnings.push(`Two nodes share the id "${node.id}".`)
    seen.add(node.id)

    if (node.role && !NODE_STYLES[node.role]) {
      warnings.push(`Node "${node.id}" uses an unknown role "${node.role}".`)
    }

    let { box } = nodeLayout(node)
    if (box.left < 0 || box.top < 0 || box.left + box.w > width || box.top + box.h > height) {
      warnings.push(`Node "${node.id}" falls outside the ${width}×${height} canvas.`)
    }
  }

  for (let edge of edges) {
    if (!seen.has(edge.from)) warnings.push(`An edge starts at the unknown node "${edge.from}".`)
    if (!seen.has(edge.to)) warnings.push(`An edge ends at the unknown node "${edge.to}".`)
  }

  return warnings
}
