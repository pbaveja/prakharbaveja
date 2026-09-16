'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/Button'
import {
  NODE_COLORS,
  NODE_HEIGHT,
  NODE_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '@/components/DiagramSvg'

const NODE_COLOR_ORDER = ['grey', 'yellow', 'blue', 'green']

function newId() {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `n${Math.random().toString(36).slice(2)}`
}

function ToolButton({ active, ...props }) {
  return (
    <button
      type="button"
      className={
        'rounded-md border-2 border-zinc-900 px-2.5 py-1 text-xs font-medium transition dark:border-zinc-100 ' +
        (active
          ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-700'
          : 'bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200')
      }
      {...props}
    />
  )
}

export function DiagramBuilderModal({ open, onInsert, onClose }) {
  let svgRef = useRef(null)
  let dragRef = useRef(null)

  let [nodes, setNodes] = useState([])
  let [edges, setEdges] = useState([])
  let [mode, setMode] = useState('select')
  let [connectFrom, setConnectFrom] = useState(null)
  let [selectedNodeId, setSelectedNodeId] = useState(null)
  let [selectedEdgeId, setSelectedEdgeId] = useState(null)

  if (!open) return null

  let selectedNode = nodes.find((node) => node.id === selectedNodeId)

  function reset() {
    setNodes([])
    setEdges([])
    setMode('select')
    setConnectFrom(null)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }

  // Assumes the <svg> element's own box is exactly VIEW_WIDTH:VIEW_HEIGHT
  // (enforced below via the `aspect-video` class, since 800:450 = 16:9) —
  // otherwise SVG's default `preserveAspectRatio="xMidYMid meet"` letterboxes
  // the viewBox inside the element, and a naive width/height ratio (with no
  // offset for the letterbox bands) maps clicks to the wrong point.
  function toViewBoxPoint(event) {
    let rect = svgRef.current.getBoundingClientRect()
    let scale = VIEW_WIDTH / rect.width
    return {
      x: (event.clientX - rect.left) * scale,
      y: (event.clientY - rect.top) * scale,
    }
  }

  // Keeps a node's full rectangle (not just its center) within the visible
  // viewBox, so it can never be clipped when rendered as a real <svg> later
  // — a safety net against drags that continue past the canvas edge.
  function clampNodePosition(x, y) {
    return {
      x: Math.min(Math.max(x, NODE_WIDTH / 2), VIEW_WIDTH - NODE_WIDTH / 2),
      y: Math.min(Math.max(y, NODE_HEIGHT / 2), VIEW_HEIGHT - NODE_HEIGHT / 2),
    }
  }

  function handleCanvasClick(event) {
    if (mode !== 'add') return
    let point = toViewBoxPoint(event)
    let { x, y } = clampNodePosition(point.x, point.y)
    let id = newId()
    setNodes((current) => [
      ...current,
      { id, x, y, label: `Node ${current.length + 1}`, detail: '', color: 'grey' },
    ])
    setSelectedNodeId(id)
    setSelectedEdgeId(null)
    setMode('select')
  }

  function handleNodePointerDown(event, node) {
    event.stopPropagation()

    if (mode === 'connect') {
      if (!connectFrom) {
        setConnectFrom(node.id)
      } else if (connectFrom !== node.id) {
        setEdges((current) => [
          ...current,
          { id: newId(), from: connectFrom, to: node.id, label: '' },
        ])
        setConnectFrom(null)
        setMode('select')
      }
      return
    }

    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)

    let startPoint = toViewBoxPoint(event)
    dragRef.current = {
      nodeId: node.id,
      offsetX: node.x - startPoint.x,
      offsetY: node.y - startPoint.y,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleCanvasPointerMove(event) {
    if (!dragRef.current) return
    let point = toViewBoxPoint(event)
    let { nodeId, offsetX, offsetY } = dragRef.current
    let { x, y } = clampNodePosition(point.x + offsetX, point.y + offsetY)
    setNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, x, y } : node)),
    )
  }

  function handleCanvasPointerUp() {
    dragRef.current = null
  }

  function updateSelectedNode(patch) {
    setNodes((current) =>
      current.map((node) => (node.id === selectedNodeId ? { ...node, ...patch } : node)),
    )
  }

  function deleteSelected() {
    if (selectedNodeId) {
      setNodes((current) => current.filter((node) => node.id !== selectedNodeId))
      setEdges((current) =>
        current.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId),
      )
      setSelectedNodeId(null)
    } else if (selectedEdgeId) {
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId))
      setSelectedEdgeId(null)
    }
  }

  function handleInsert() {
    if (nodes.length === 0) return
    let data = { nodes, edges }
    let json = JSON.stringify(data, null, 2)
    onInsert(`\n<Diagram data={${json}} />\n`)
    reset()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-md border-2 border-zinc-900 bg-white p-6 shadow-brutal dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-brutal-dark">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Build a diagram
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ToolButton active={mode === 'add'} onClick={() => setMode(mode === 'add' ? 'select' : 'add')}>
            Add node
          </ToolButton>
          <ToolButton
            active={mode === 'connect'}
            onClick={() => {
              setConnectFrom(null)
              setMode(mode === 'connect' ? 'select' : 'connect')
            }}
          >
            Connect
          </ToolButton>
          <ToolButton onClick={deleteSelected} disabled={!selectedNodeId && !selectedEdgeId}>
            Delete selected
          </ToolButton>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'add' && 'Click the canvas to place a node.'}
            {mode === 'connect' &&
              (connectFrom ? 'Click the target node.' : 'Click the source node.')}
            {mode === 'select' && 'Drag nodes to move them; click to select.'}
          </span>
        </div>

        <div className="mt-3 flex flex-1 gap-4 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="aspect-video flex-1 touch-none rounded-md border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950"
            onClick={handleCanvasClick}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
          >
            {edges.map((edge) => {
              let fromNode = nodes.find((node) => node.id === edge.from)
              let toNode = nodes.find((node) => node.id === edge.to)
              if (!fromNode || !toNode) return null

              return (
                <line
                  key={edge.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  strokeWidth={selectedEdgeId === edge.id ? 4 : 2}
                  className={
                    selectedEdgeId === edge.id
                      ? 'stroke-blue-500'
                      : 'stroke-zinc-500 dark:stroke-zinc-400'
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedEdgeId(edge.id)
                    setSelectedNodeId(null)
                  }}
                />
              )
            })}

            {nodes.map((node) => {
              let colors = NODE_COLORS[node.color] || NODE_COLORS.grey
              let isHighlighted = node.id === selectedNodeId || node.id === connectFrom

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y - NODE_HEIGHT / 2})`}
                  onPointerDown={(event) => handleNodePointerDown(event, node)}
                  onClick={(event) => event.stopPropagation()}
                  className="cursor-grab"
                >
                  {isHighlighted && (
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
                    strokeWidth={2}
                    className={`${colors.fill} stroke-zinc-900 dark:stroke-zinc-100`}
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`pointer-events-none text-[13px] font-medium ${colors.text}`}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="w-56 flex-shrink-0 overflow-y-auto">
            {selectedNode ? (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Label
                  <input
                    value={selectedNode.label}
                    onChange={(event) => updateSelectedNode({ label: event.target.value })}
                    className="rounded-md border-2 border-zinc-900 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Detail (shown when clicked)
                  <textarea
                    value={selectedNode.detail}
                    onChange={(event) => updateSelectedNode({ detail: event.target.value })}
                    rows={5}
                    className="rounded-md border-2 border-zinc-900 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </label>
                <div className="flex flex-col gap-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Color
                  <div className="flex gap-2">
                    {NODE_COLOR_ORDER.map((colorKey) => (
                      <button
                        key={colorKey}
                        type="button"
                        aria-label={NODE_COLORS[colorKey].label}
                        title={NODE_COLORS[colorKey].label}
                        onClick={() => updateSelectedNode({ color: colorKey })}
                        style={{ backgroundColor: NODE_COLORS[colorKey].swatch }}
                        className={
                          'h-6 w-6 rounded-full border-2 border-zinc-900 dark:border-zinc-100' +
                          ((selectedNode.color || 'grey') === colorKey
                            ? ' ring-2 ring-blue-500 ring-offset-1'
                            : '')
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedEdgeId ? (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Edge label
                <input
                  value={edges.find((edge) => edge.id === selectedEdgeId)?.label || ''}
                  onChange={(event) => {
                    let value = event.target.value
                    setEdges((current) =>
                      current.map((edge) =>
                        edge.id === selectedEdgeId ? { ...edge, label: value } : edge,
                      ),
                    )
                  }}
                  className="rounded-md border-2 border-zinc-900 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </label>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select a node or edge to edit it.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert} disabled={nodes.length === 0}>
            Insert diagram
          </Button>
        </div>
      </div>
    </div>
  )
}
