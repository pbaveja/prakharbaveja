// Plain presentational component — deliberately NOT 'use client'. It's
// imported both by Diagram.jsx (the interactive, client-rendered version
// used in production) and by mdxValidate.jsx's server-side studio preview
// (which renders via `react-dom/server` outside Next's own RSC pipeline, so
// it can only safely call plain functions — importing a 'use client' module
// there resolves to an inert client-reference object instead of the real
// component and throws "Element type is invalid... but got: object").
//
// All geometry lives in @/lib/diagramLayout, which is unit tested.

import {
  FONT_SIZE,
  canvasSize,
  edgeGeometry,
  edgeLabelPosition,
  groupLayout,
  groupParallelEdges,
  isLater,
  layoutNodes,
  legendLayout,
  nodeStyle,
  offsetPerpendicular,
  parallelOffset,
} from '@/lib/diagramLayout'

export {
  DEFAULT_HEIGHT as VIEW_HEIGHT,
  DEFAULT_WIDTH as VIEW_WIDTH,
  LEGACY_COLOR_ORDER,
  NODE_HEIGHT,
  NODE_STYLES,
  NODE_STYLES as NODE_COLORS,
  NODE_WIDTH,
  ROLE_ORDER,
  scrollMinWidth,
} from '@/lib/diagramLayout'

const DASH = '6 4'
const INNER_DASH = '5 4'

function NodeBody({ layout, style }) {
  return (
    <>
      {layout.title.map((line, index) => (
        <text
          key={`t${index}`}
          x={line.x}
          y={line.y}
          textAnchor="middle"
          dominantBaseline={layout.simple ? 'middle' : undefined}
          className={`${style.text} font-semibold`}
          fontSize={FONT_SIZE.title}
        >
          {line.text}
        </text>
      ))}

      {layout.sublabel.map((line, index) => (
        <text
          key={`s${index}`}
          x={line.x}
          y={line.y}
          textAnchor="middle"
          className={`${style.text} opacity-70`}
          fontSize={FONT_SIZE.sublabel}
        >
          {line.text}
        </text>
      ))}

      {layout.lines.map((line, index) => (
        <text key={`l${index}`} x={line.x} y={line.y} className={style.text} fontSize={FONT_SIZE.body}>
          {line.text}
        </text>
      ))}
    </>
  )
}

export function DiagramSvg({ data, nodes, edges, selectedNodeId, onNodeClick }) {
  // Accepts either the whole `data` object or the older (nodes, edges) pair,
  // so both call sites and any in-flight editor state keep working.
  let diagram = data ?? { nodes, edges }
  let allNodes = diagram.nodes || []
  let allEdges = diagram.edges || []
  let groups = diagram.groups || []
  let { width, height } = canvasSize(diagram)

  let layouts = layoutNodes(allNodes)
  let parallelGroups = groupParallelEdges(allEdges)
  let legend = legendLayout(diagram.legend)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={diagram.alt || diagram.caption || 'Diagram'}
      // font-sans is JetBrains Mono here, and pinning it on the <svg> keeps
      // the diagram legible wherever it's rendered — `not-prose` strips the
      // article's typography, and the studio preview has no page font at all.
      // The text wrapping in diagramLayout assumes this monospace advance.
      className="w-full rounded-md border-2 border-zinc-900 bg-white font-sans dark:border-zinc-100 dark:bg-zinc-900"
    >
      <defs>
        <marker
          id="diagram-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-zinc-500 dark:fill-zinc-400" />
        </marker>
      </defs>

      {/* Panels first, so every node and edge draws on top of them. */}
      {groups.map((group) => {
        let { box, label } = groupLayout(group)

        return (
          <g key={group.id}>
            <rect
              x={box.left}
              y={box.top}
              width={box.w}
              height={box.h}
              rx={8}
              className="fill-none stroke-zinc-400 dark:stroke-zinc-600"
              strokeWidth={1.5}
              strokeDasharray="3 4"
            />
            {label && (
              <text
                x={label.x}
                y={label.y}
                className="fill-zinc-500 font-semibold uppercase tracking-wide dark:fill-zinc-400"
                fontSize={FONT_SIZE.groupLabel}
              >
                {label.text}
              </text>
            )}
          </g>
        )
      })}

      {allEdges.map((edge) => {
        let fromLayout = layouts[edge.from]
        let toLayout = layouts[edge.to]
        if (!fromLayout || !toLayout) return null

        let geometry = edgeGeometry(fromLayout.box, toLayout.box, edge)

        // Explicitly anchored edges are left exactly where the author put
        // them; only the center-to-center ones get fanned apart.
        let group = parallelGroups[[edge.from, edge.to].sort().join('|')]
        let coords = geometry.explicit
          ? geometry
          : offsetPerpendicular(geometry, parallelOffset(group, edge.id))

        let label = edge.label ? edgeLabelPosition(coords, edge) : null
        let later = isLater(edge)

        return (
          <g key={edge.id}>
            <line
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              className="stroke-zinc-500 dark:stroke-zinc-400"
              strokeWidth={2}
              strokeDasharray={later ? DASH : undefined}
              markerStart={edge.both ? 'url(#diagram-arrow)' : undefined}
              markerEnd="url(#diagram-arrow)"
            />
            {label && (
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                className="fill-zinc-600 dark:fill-zinc-300"
                fontSize={FONT_SIZE.edgeLabel}
              >
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {allNodes.map((node) => {
        let layout = layouts[node.id]
        let { box } = layout
        let isSelected = node.id === selectedNodeId
        let hasDetail = Boolean(node.detail)
        let interactive = hasDetail && Boolean(onNodeClick)
        let style = nodeStyle(node)

        return (
          <g
            key={node.id}
            onClick={interactive ? () => onNodeClick(node) : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onNodeClick(node)
                    }
                  }
                : undefined
            }
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-expanded={interactive ? isSelected : undefined}
            className={interactive ? 'cursor-pointer focus:outline-none' : undefined}
          >
            {isSelected && (
              <rect
                x={box.left - 4}
                y={box.top - 4}
                width={box.w + 8}
                height={box.h + 8}
                rx={7}
                className="fill-none stroke-blue-500"
                strokeWidth={2}
              />
            )}

            <rect
              x={box.left}
              y={box.top}
              width={box.w}
              height={box.h}
              rx={4}
              className={`${style.fill} stroke-zinc-900 dark:stroke-zinc-100`}
              strokeWidth={2}
              strokeDasharray={isLater(node) ? DASH : undefined}
            />

            <NodeBody layout={layout} style={style} />

            {layout.children.map((child) => (
              <g key={child.key}>
                <rect
                  x={child.left}
                  y={child.top}
                  width={child.w}
                  height={child.h}
                  rx={4}
                  className="fill-white stroke-zinc-900/60 dark:fill-zinc-900 dark:stroke-zinc-100/60"
                  strokeWidth={1.5}
                  strokeDasharray={isLater(child) ? INNER_DASH : undefined}
                />
                <text
                  x={child.textX}
                  y={child.textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-zinc-800 dark:fill-zinc-200"
                  fontSize={FONT_SIZE.child}
                >
                  {child.label}
                </text>
              </g>
            ))}

            {/* Marks a box as having more behind a click. */}
            {interactive && (
              <circle
                cx={box.left + box.w - 10}
                cy={box.top + 10}
                r={3}
                className="fill-zinc-900/40 dark:fill-zinc-100/40"
              />
            )}
          </g>
        )
      })}

      {legend && (
        <g>
          <rect
            x={legend.box.left}
            y={legend.box.top}
            width={legend.box.w}
            height={legend.box.h}
            rx={6}
            className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700"
            strokeWidth={1.5}
          />
          {legend.entries.map((entry) => (
            <g key={entry.key}>
              <rect
                x={entry.swatchX}
                y={entry.swatchY}
                width={entry.swatchW}
                height={entry.swatchH}
                rx={3}
                className={
                  entry.role
                    ? `${nodeStyle(entry).fill} stroke-zinc-900 dark:stroke-zinc-100`
                    : 'fill-none stroke-zinc-500 dark:stroke-zinc-400'
                }
                strokeWidth={1.5}
                strokeDasharray={entry.role ? undefined : DASH}
              />
              <text
                x={entry.labelX}
                y={entry.labelY}
                dominantBaseline="middle"
                className="fill-zinc-600 dark:fill-zinc-300"
                fontSize={FONT_SIZE.legend}
              >
                {entry.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
