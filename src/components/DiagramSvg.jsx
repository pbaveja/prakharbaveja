// Plain presentational component — deliberately NOT 'use client'. It's
// imported both by Diagram.jsx (the interactive, client-rendered version
// used in production) and by mdxValidate.jsx's server-side studio preview
// (which renders via `react-dom/server` outside Next's own RSC pipeline, so
// it can only safely call plain functions — importing a 'use client' module
// there resolves to an inert client-reference object instead of the real
// component and throws "Element type is invalid... but got: object").

export const VIEW_WIDTH = 800
export const VIEW_HEIGHT = 450
export const NODE_WIDTH = 140
export const NODE_HEIGHT = 56

export const NODE_COLORS = {
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
}

// A small gap beyond the node's true border so the line/arrowhead doesn't
// visually merge with the node's own stroke.
const EDGE_GAP = 3

// Offset, in px, between edges that connect the same pair of nodes, so
// parallel connections fan out instead of drawing exactly on top of
// each other.
const PARALLEL_EDGE_SPACING = 14

// Where a ray from a rectangle's center in direction (dx, dy) exits the
// rectangle — exact border intersection, not an ellipse approximation, so
// lines terminate flush with the node's edge instead of cutting into it.
function rectBoundaryPoint(center, dx, dy) {
  if (dx === 0 && dy === 0) return { x: center.x, y: center.y }

  let halfWidth = NODE_WIDTH / 2 + EDGE_GAP
  let halfHeight = NODE_HEIGHT / 2 + EDGE_GAP
  let t = Math.min(
    dx !== 0 ? halfWidth / Math.abs(dx) : Infinity,
    dy !== 0 ? halfHeight / Math.abs(dy) : Infinity,
  )

  return { x: center.x + dx * t, y: center.y + dy * t }
}

function edgeEndpoints(fromNode, toNode) {
  let dx = toNode.x - fromNode.x
  let dy = toNode.y - fromNode.y
  let start = rectBoundaryPoint(fromNode, dx, dy)
  let end = rectBoundaryPoint(toNode, -dx, -dy)

  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
}

// Groups edges that share the same (unordered) pair of endpoints, so
// multiple connections between the same two nodes can be fanned out
// instead of overlapping.
function groupParallelEdges(edges) {
  let groups = {}
  for (let edge of edges) {
    let key = [edge.from, edge.to].sort().join('|')
    if (!groups[key]) groups[key] = []
    groups[key].push(edge.id)
  }
  return groups
}

export function DiagramSvg({ nodes, edges, selectedNodeId, onNodeClick }) {
  let nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]))
  let parallelGroups = groupParallelEdges(edges)

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="w-full rounded-md border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900"
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

      {edges.map((edge) => {
        let fromNode = nodesById[edge.from]
        let toNode = nodesById[edge.to]
        if (!fromNode || !toNode) return null

        let { x1, y1, x2, y2 } = edgeEndpoints(fromNode, toNode)

        // Fan out parallel edges (same node pair) perpendicular to the line.
        let group = parallelGroups[[edge.from, edge.to].sort().join('|')]
        let indexInGroup = group.indexOf(edge.id)
        let offset = (indexInGroup - (group.length - 1) / 2) * PARALLEL_EDGE_SPACING
        if (offset !== 0) {
          let length = Math.hypot(x2 - x1, y2 - y1) || 1
          let perpX = (-(y2 - y1) / length) * offset
          let perpY = ((x2 - x1) / length) * offset
          x1 += perpX
          y1 += perpY
          x2 += perpX
          y2 += perpY
        }

        let midX = (x1 + x2) / 2
        let midY = (y1 + y2) / 2

        return (
          <g key={edge.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="stroke-zinc-500 dark:stroke-zinc-400"
              strokeWidth={2}
              markerEnd="url(#diagram-arrow)"
            />
            {edge.label && (
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                className="fill-zinc-600 text-[11px] dark:fill-zinc-300"
              >
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {nodes.map((node) => {
        let isSelected = node.id === selectedNodeId
        let hasDetail = Boolean(node.detail)
        let colors = NODE_COLORS[node.color] || NODE_COLORS.grey

        return (
          <g
            key={node.id}
            transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y - NODE_HEIGHT / 2})`}
            onClick={() => onNodeClick?.(node)}
            className={hasDetail && onNodeClick ? 'cursor-pointer' : undefined}
          >
            {isSelected && (
              <rect
                x={-4}
                y={-4}
                width={NODE_WIDTH + 8}
                height={NODE_HEIGHT + 8}
                rx={7}
                className="fill-none stroke-blue-500"
                strokeWidth={2}
              />
            )}
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={4}
              className={`${colors.fill} stroke-zinc-900 dark:stroke-zinc-100`}
              strokeWidth={2}
            />
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`${colors.text} text-[13px] font-medium`}
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
