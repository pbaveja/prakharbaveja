import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MIN_WIDTH,
  NODE_HEIGHT,
  NODE_WIDTH,
  anchorOn,
  canvasSize,
  charBudget,
  diagramWarnings,
  edgeGeometry,
  edgeLabelPosition,
  groupParallelEdges,
  isLater,
  legendLayout,
  nodeLayout,
  nodeStyle,
  offsetPerpendicular,
  parallelOffset,
  resolveBox,
  scrollMinWidth,
  wrapText,
} from './diagramLayout'

describe('resolveBox', () => {
  it('treats x/y as the center', () => {
    expect(resolveBox({ x: 100, y: 100 })).toMatchObject({ cx: 100, cy: 100, left: 30, top: 72 })
  })

  it('accepts left/top instead, for ports from existing SVGs', () => {
    expect(resolveBox({ left: 40, top: 90, w: 260, h: 210 })).toMatchObject({
      left: 40,
      top: 90,
      cx: 170,
      cy: 195,
    })
  })

  it('prefers x/y when both are given', () => {
    expect(resolveBox({ x: 500, left: 0, w: 100, h: 100 }).cx).toBe(500)
  })
})

describe('wrapText', () => {
  it('returns nothing for empty input', () => {
    expect(wrapText('', 20)).toEqual([])
    expect(wrapText(undefined, 20)).toEqual([])
  })

  it('leaves text that fits on one line', () => {
    expect(wrapText('Supabase Auth', 20)).toEqual(['Supabase Auth'])
  })

  it('wraps on word boundaries within the budget', () => {
    expect(wrapText('Reads SMS and payment notifications', 20)).toEqual([
      'Reads SMS and',
      'payment',
      'notifications',
    ])
  })

  it('honours explicit newlines', () => {
    expect(wrapText('one\ntwo', 40)).toEqual(['one', 'two'])
  })

  it('never drops a word longer than the budget', () => {
    expect(wrapText('indistinguishable', 5)).toEqual(['indistinguishable'])
  })
})

describe('charBudget', () => {
  it('shrinks as the font grows', () => {
    expect(charBudget(280, 12)).toBeGreaterThan(charBudget(280, 20))
  })

  it('never returns zero', () => {
    expect(charBudget(10, 40)).toBe(1)
  })
})

describe('nodeLayout', () => {
  it('keeps a label-only node at the original fixed size, text centered', () => {
    let layout = nodeLayout({ id: 'a', x: 100, y: 100, label: 'Plain' })

    expect(layout.simple).toBe(true)
    expect(layout.box).toMatchObject({ w: NODE_WIDTH, h: NODE_HEIGHT })
    expect(layout.title).toHaveLength(1)
    expect(layout.title[0].y).toBe(100)
  })

  it('grows to fit a title that has to wrap', () => {
    let layout = nodeLayout({ id: 'a', x: 100, y: 100, label: 'A very long title indeed here' })

    expect(layout.title.length).toBeGreaterThan(1)
    expect(layout.box.h).toBeGreaterThan(NODE_HEIGHT)
  })

  it('derives a height from subtitle, body lines and inner boxes', () => {
    let bare = nodeLayout({ id: 'a', left: 0, top: 0, w: 260, label: 'Phone' })
    let full = nodeLayout({
      id: 'a',
      left: 0,
      top: 0,
      w: 260,
      label: 'Phone',
      sublabel: 'Offline first',
      lines: ['Reads messages', 'Redacts them'],
      children: [{ label: 'One' }, { label: 'Two' }],
    })

    expect(full.simple).toBe(false)
    expect(full.box.h).toBeGreaterThan(bare.box.h)
  })

  it('respects an explicit height instead of the measured one', () => {
    let layout = nodeLayout({ id: 'a', left: 0, top: 0, w: 260, h: 430, label: 'API', sublabel: 's' })
    expect(layout.box.h).toBe(430)
  })

  it('stacks inner boxes in order, inside the parent, without overlapping', () => {
    let layout = nodeLayout({
      id: 'api',
      left: 0,
      top: 0,
      w: 280,
      label: 'FastAPI',
      children: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
    })

    let [first, second, third] = layout.children
    expect(first.top).toBeLessThan(second.top)
    expect(first.top + first.h).toBeLessThanOrEqual(second.top)
    expect(third.top + third.h).toBeLessThanOrEqual(layout.box.top + layout.box.h)
    expect(first.left).toBeGreaterThan(layout.box.left)
    expect(first.w).toBeLessThan(layout.box.w)
  })

  it('gives every inner box a stable key', () => {
    let layout = nodeLayout({
      id: 'api',
      x: 100,
      y: 100,
      label: 'API',
      children: [{ label: 'One' }, { id: 'named', label: 'Two' }],
    })

    expect(layout.children.map((child) => child.key)).toEqual(['api-child-0', 'named'])
  })
})

describe('anchorOn', () => {
  let box = resolveBox({ left: 100, top: 100, w: 200, h: 100 })

  it('puts a point just outside each named face', () => {
    expect(anchorOn(box, 'left').x).toBeLessThan(100)
    expect(anchorOn(box, 'right').x).toBeGreaterThan(300)
    expect(anchorOn(box, 'top').y).toBeLessThan(100)
    expect(anchorOn(box, 'bottom').y).toBeGreaterThan(200)
  })

  it('places the point along the face by fraction', () => {
    expect(anchorOn(box, 'right', 0).y).toBe(100)
    expect(anchorOn(box, 'right', 1).y).toBe(200)
    expect(anchorOn(box, 'right', 0.25).y).toBe(125)
  })

  it('clamps fractions outside 0..1 onto the face', () => {
    expect(anchorOn(box, 'right', -3).y).toBe(100)
    expect(anchorOn(box, 'right', 9).y).toBe(200)
  })

  it('returns null for an unknown side', () => {
    expect(anchorOn(box, 'sideways')).toBeNull()
  })
})

describe('edgeGeometry', () => {
  let left = resolveBox({ left: 0, top: 0, w: 100, h: 100 })
  let right = resolveBox({ left: 300, top: 0, w: 100, h: 100 })

  it('falls back to the center-to-center boundary when no side is named', () => {
    let geometry = edgeGeometry(left, right, {})

    expect(geometry.explicit).toBe(false)
    expect(geometry.y1).toBe(50)
    expect(geometry.x1).toBeGreaterThan(100)
    expect(geometry.x2).toBeLessThan(300)
  })

  it('anchors to the named faces at the named fractions', () => {
    let geometry = edgeGeometry(left, right, {
      fromSide: 'right',
      fromAt: 0.2,
      toSide: 'left',
      toAt: 0.8,
    })

    expect(geometry.explicit).toBe(true)
    expect(geometry.y1).toBe(20)
    expect(geometry.y2).toBe(80)
  })

  it('counts as explicit when only one end names a side', () => {
    expect(edgeGeometry(left, right, { fromSide: 'top' }).explicit).toBe(true)
  })
})

describe('parallel edges', () => {
  let edges = [
    { id: 'a', from: 'x', to: 'y' },
    { id: 'b', from: 'y', to: 'x' },
    { id: 'c', from: 'x', to: 'z' },
  ]

  it('groups edges by unordered endpoint pair', () => {
    let groups = groupParallelEdges(edges)
    expect(groups['x|y']).toEqual(['a', 'b'])
    expect(groups['x|z']).toEqual(['c'])
  })

  it('leaves a lone edge unshifted and fans a pair symmetrically', () => {
    let groups = groupParallelEdges(edges)
    expect(parallelOffset(groups['x|z'], 'c')).toBe(0)
    expect(parallelOffset(groups['x|y'], 'a')).toBe(-parallelOffset(groups['x|y'], 'b'))
  })

  it('shifts perpendicular to the line, preserving its length', () => {
    let shifted = offsetPerpendicular({ x1: 0, y1: 0, x2: 100, y2: 0 }, 10)
    expect(shifted).toMatchObject({ y1: 10, y2: 10, x1: 0, x2: 100 })
  })

  it('is a no-op for a zero offset', () => {
    let line = { x1: 0, y1: 0, x2: 10, y2: 10 }
    expect(offsetPerpendicular(line, 0)).toEqual(line)
  })
})

describe('edgeLabelPosition', () => {
  it('sits above a mostly-horizontal line', () => {
    let label = edgeLabelPosition({ x1: 0, y1: 50, x2: 100, y2: 50 }, {})
    expect(label).toMatchObject({ x: 50, anchor: 'middle' })
    expect(label.y).toBeLessThan(50)
  })

  it('sits beside a mostly-vertical line', () => {
    let label = edgeLabelPosition({ x1: 50, y1: 0, x2: 50, y2: 100 }, {})
    expect(label).toMatchObject({ y: 50, anchor: 'start' })
    expect(label.x).toBeGreaterThan(50)
  })

  it('applies the author’s nudge', () => {
    let label = edgeLabelPosition({ x1: 0, y1: 50, x2: 100, y2: 50 }, { labelDx: 5, labelDy: -5 })
    expect(label.x).toBe(55)
    expect(label.y).toBe(38)
  })
})

describe('canvas sizing', () => {
  it('defaults to the original 800×450', () => {
    expect(canvasSize(undefined)).toEqual({ width: 800, height: 450 })
  })

  it('never makes a standard-width diagram scroll', () => {
    expect(scrollMinWidth({ width: 800 })).toBeNull()
  })

  it('makes a wide diagram scroll rather than shrink', () => {
    expect(scrollMinWidth({ width: 1120 })).toBe(DEFAULT_MIN_WIDTH)
  })

  it('lets the author override or switch it off', () => {
    expect(scrollMinWidth({ width: 1120, minWidth: 1000 })).toBe(1000)
    expect(scrollMinWidth({ width: 1120, minWidth: 0 })).toBeNull()
  })
})

describe('nodeStyle', () => {
  it('resolves roles, legacy colors and unknown values', () => {
    expect(nodeStyle({ role: 'vendor' })).toBe(nodeStyle({ role: 'vendor' }))
    expect(nodeStyle({ color: 'yellow' }).swatch).toBe('#FFE600')
    expect(nodeStyle({ role: 'nonsense' })).toEqual(nodeStyle({}))
  })

  it('prefers a role over a legacy color', () => {
    expect(nodeStyle({ role: 'vendor', color: 'yellow' }).label).toBe('Outside vendor')
  })
})

describe('isLater', () => {
  it('only matches the later state', () => {
    expect(isLater({ state: 'later' })).toBe(true)
    expect(isLater({ state: 'now' })).toBe(false)
    expect(isLater(undefined)).toBe(false)
  })
})

describe('legendLayout', () => {
  it('is absent when no legend is declared', () => {
    expect(legendLayout(undefined)).toBeNull()
  })

  it('sizes itself around its entries and stacks them', () => {
    let legend = legendLayout({
      left: 800,
      top: 40,
      entries: [{ role: 'own', label: 'Yours' }, { state: 'later', label: 'Later' }],
    })

    expect(legend.box.h).toBeGreaterThan(0)
    expect(legend.entries[1].swatchY).toBeGreaterThan(legend.entries[0].swatchY)
    expect(legend.entries[0].labelX).toBeGreaterThan(legend.entries[0].swatchX)
  })
})

describe('diagramWarnings', () => {
  it('passes a well-formed diagram', () => {
    expect(
      diagramWarnings({
        nodes: [
          { id: 'a', x: 100, y: 100, label: 'A' },
          { id: 'b', x: 300, y: 100, label: 'B' },
        ],
        edges: [{ id: 'e', from: 'a', to: 'b' }],
      }),
    ).toEqual([])
  })

  it('catches duplicate ids, unknown roles, off-canvas boxes and dangling edges', () => {
    let warnings = diagramWarnings({
      nodes: [
        { id: 'a', x: 100, y: 100, label: 'A' },
        { id: 'a', x: 200, y: 100, label: 'Also A' },
        { id: 'c', x: 100, y: 100, label: 'C', role: 'nope' },
        { id: 'd', x: 5000, y: 100, label: 'D' },
      ],
      edges: [{ id: 'e', from: 'a', to: 'missing' }],
    })

    expect(warnings.join('\n')).toMatch(/share the id "a"/)
    expect(warnings.join('\n')).toMatch(/unknown role "nope"/)
    expect(warnings.join('\n')).toMatch(/falls outside/)
    expect(warnings.join('\n')).toMatch(/unknown node "missing"/)
  })
})
