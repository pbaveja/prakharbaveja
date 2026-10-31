'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { DiagramSvg } from '@/components/DiagramSvg'
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  LEGACY_COLOR_ORDER,
  NODE_HEIGHT,
  NODE_STYLES,
  NODE_WIDTH,
  ROLE_ORDER,
  diagramWarnings,
  groupLayout,
  nodeLayout,
} from '@/lib/diagramLayout'

const SWATCH_ORDER = [...ROLE_ORDER, ...LEGACY_COLOR_ORDER.filter((key) => key !== 'grey')]

const CANVAS_PRESETS = [
  { label: 'Standard · 800×450', width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
  { label: 'Tall · 800×700', width: 800, height: 700 },
  { label: 'Wide · 1120×740', width: 1120, height: 740 },
]

const SIDES = ['auto', 'left', 'right', 'top', 'bottom']

const MIN_NODE_WIDTH = 80
const MIN_NODE_HEIGHT = 40
const MIN_GROUP_SIZE = 60

const inputClass =
  'w-full rounded-md border-2 border-zinc-900 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100'
const labelClass = 'flex flex-col gap-1 text-xs font-medium text-zinc-800 dark:text-zinc-200'

function newId(prefix = 'n') {
  return typeof crypto?.randomUUID === 'function'
    ? `${prefix}${crypto.randomUUID().slice(0, 8)}`
    : `${prefix}${Math.random().toString(36).slice(2, 10)}`
}

function ToolButton({ active, ...props }) {
  return (
    <button
      type="button"
      className={
        'rounded-md border-2 border-zinc-900 px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 dark:border-zinc-100 ' +
        (active
          ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-700'
          : 'bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200')
      }
      {...props}
    />
  )
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
      <input type="checkbox" checked={Boolean(checked)} onChange={onChange} />
      {label}
    </label>
  )
}

/** A number input where empty means "let the layout decide". */
function AutoNumberField({ label, value, onChange }) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        placeholder="auto"
        value={value ?? ''}
        onChange={(event) => {
          let next = event.target.value
          onChange(next === '' ? undefined : Number(next))
        }}
        className={inputClass}
      />
    </label>
  )
}

export function DiagramBuilderModal({ open, onInsert, onClose }) {
  let overlayRef = useRef(null)
  let dragRef = useRef(null)

  let [width, setWidth] = useState(DEFAULT_WIDTH)
  let [height, setHeight] = useState(DEFAULT_HEIGHT)
  let [caption, setCaption] = useState('')
  let [nodes, setNodes] = useState([])
  let [groups, setGroups] = useState([])
  let [edges, setEdges] = useState([])
  let [mode, setMode] = useState('select')
  let [connectFrom, setConnectFrom] = useState(null)
  let [selection, setSelection] = useState(null)

  if (!open) return null

  let data = {
    width,
    height,
    caption: caption || undefined,
    groups,
    nodes,
    edges,
  }
  let warnings = diagramWarnings(data)

  let selectedNode = selection?.kind === 'node' ? nodes.find((n) => n.id === selection.id) : null
  let selectedGroup = selection?.kind === 'group' ? groups.find((g) => g.id === selection.id) : null
  let selectedEdge = selection?.kind === 'edge' ? edges.find((e) => e.id === selection.id) : null

  function reset() {
    setWidth(DEFAULT_WIDTH)
    setHeight(DEFAULT_HEIGHT)
    setCaption('')
    setNodes([])
    setGroups([])
    setEdges([])
    setMode('select')
    setConnectFrom(null)
    setSelection(null)
  }

  // The overlay <svg> is sized to the same aspect ratio as the viewBox, so
  // SVG's default xMidYMid letterboxing never kicks in and a plain
  // width-ratio scale maps clicks to the right point.
  function toViewBoxPoint(event) {
    let rect = overlayRef.current.getBoundingClientRect()
    let scale = width / rect.width
    return { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale }
  }

  function clampCenter(x, y, w, h) {
    return {
      x: Math.min(Math.max(x, w / 2), width - w / 2),
      y: Math.min(Math.max(y, h / 2), height - h / 2),
    }
  }

  function patchNode(id, patch) {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, ...patch } : node)))
  }

  function patchGroup(id, patch) {
    setGroups((current) => current.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  function patchEdge(id, patch) {
    setEdges((current) => current.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge)))
  }

  function handleCanvasClick(event) {
    if (mode === 'add-node') {
      let point = toViewBoxPoint(event)
      let { x, y } = clampCenter(point.x, point.y, NODE_WIDTH, NODE_HEIGHT)
      let id = newId('n')
      setNodes((current) => [
        ...current,
        { id, x, y, label: `Node ${current.length + 1}`, role: 'grey' },
      ])
      setSelection({ kind: 'node', id })
      setMode('select')
      return
    }

    if (mode === 'add-group') {
      let point = toViewBoxPoint(event)
      let id = newId('g')
      setGroups((current) => [
        ...current,
        { id, left: Math.round(point.x), top: Math.round(point.y), w: 280, h: 220, label: 'PANEL' },
      ])
      setSelection({ kind: 'group', id })
      setMode('select')
      return
    }

    setSelection(null)
  }

  function startDrag(event, kind, id, box) {
    event.stopPropagation()

    if (kind === 'node' && mode === 'connect') {
      if (!connectFrom) {
        setConnectFrom(id)
      } else if (connectFrom !== id) {
        setEdges((current) => [...current, { id: newId('e'), from: connectFrom, to: id, label: '' }])
        setConnectFrom(null)
        setMode('select')
      }
      return
    }

    setSelection({ kind, id })

    let point = toViewBoxPoint(event)
    dragRef.current = {
      action: 'move',
      kind,
      id,
      offsetX: box.cx - point.x,
      offsetY: box.cy - point.y,
      w: box.w,
      h: box.h,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function startResize(event, kind, id, box) {
    event.stopPropagation()
    setSelection({ kind, id })
    dragRef.current = { action: 'resize', kind, id, left: box.left, top: box.top }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event) {
    let drag = dragRef.current
    if (!drag) return
    let point = toViewBoxPoint(event)

    if (drag.action === 'move') {
      let { x, y } = clampCenter(point.x + drag.offsetX, point.y + drag.offsetY, drag.w, drag.h)
      if (drag.kind === 'node') {
        patchNode(drag.id, { x: Math.round(x), y: Math.round(y) })
      } else {
        patchGroup(drag.id, {
          left: Math.round(x - drag.w / 2),
          top: Math.round(y - drag.h / 2),
          x: undefined,
          y: undefined,
        })
      }
      return
    }

    let minWidth = drag.kind === 'node' ? MIN_NODE_WIDTH : MIN_GROUP_SIZE
    let minHeight = drag.kind === 'node' ? MIN_NODE_HEIGHT : MIN_GROUP_SIZE
    let nextW = Math.round(Math.max(point.x - drag.left, minWidth))
    let nextH = Math.round(Math.max(point.y - drag.top, minHeight))

    if (drag.kind === 'node') {
      // Nodes are positioned by their center, so resizing from the
      // bottom-right has to move the center to keep the top-left pinned.
      patchNode(drag.id, { w: nextW, h: nextH, x: drag.left + nextW / 2, y: drag.top + nextH / 2 })
    } else {
      patchGroup(drag.id, { w: nextW, h: nextH })
    }
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  function deleteSelected() {
    if (!selection) return

    if (selection.kind === 'node') {
      setNodes((current) => current.filter((node) => node.id !== selection.id))
      setEdges((current) =>
        current.filter((edge) => edge.from !== selection.id && edge.to !== selection.id),
      )
    } else if (selection.kind === 'group') {
      setGroups((current) => current.filter((group) => group.id !== selection.id))
    } else {
      setEdges((current) => current.filter((edge) => edge.id !== selection.id))
    }

    setSelection(null)
  }

  function handleInsert() {
    if (nodes.length === 0) return

    // Strip keys the author never set, so the JSON that lands in the article
    // is the diagram and nothing else.
    let clean = JSON.parse(JSON.stringify(data, (key, value) => (value === undefined ? undefined : value)))
    onInsert(`\n<Diagram data={${JSON.stringify(clean, null, 2)}} />\n`)
    reset()
  }

  function updateChildren(node, children) {
    patchNode(node.id, { children: children.length > 0 ? children : undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-md border-2 border-zinc-900 bg-white p-6 shadow-brutal dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-brutal-dark">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Build a diagram</h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ToolButton
            active={mode === 'add-node'}
            onClick={() => setMode(mode === 'add-node' ? 'select' : 'add-node')}
          >
            Add box
          </ToolButton>
          <ToolButton
            active={mode === 'add-group'}
            onClick={() => setMode(mode === 'add-group' ? 'select' : 'add-group')}
          >
            Add panel
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
          <ToolButton onClick={deleteSelected} disabled={!selection}>
            Delete selected
          </ToolButton>

          <select
            value={`${width}x${height}`}
            onChange={(event) => {
              let preset = CANVAS_PRESETS.find(
                (item) => `${item.width}x${item.height}` === event.target.value,
              )
              if (preset) {
                setWidth(preset.width)
                setHeight(preset.height)
              }
            }}
            className="rounded-md border-2 border-zinc-900 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {CANVAS_PRESETS.map((preset) => (
              <option key={preset.label} value={`${preset.width}x${preset.height}`}>
                {preset.label}
              </option>
            ))}
          </select>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'add-node' && 'Click the canvas to place a box.'}
            {mode === 'add-group' && 'Click where the panel’s top-left corner goes.'}
            {mode === 'connect' &&
              (connectFrom ? 'Click the target box.' : 'Click the source box.')}
            {mode === 'select' && 'Drag to move, drag the corner to resize.'}
          </span>
        </div>

        <div className="mt-3 flex flex-1 gap-4 overflow-hidden">
          <div className="flex-1 overflow-auto">
            {/* The preview is the real article component, with a
                transparent interaction layer on top — what you drag is
                exactly what gets published. */}
            <div className="relative" style={{ aspectRatio: `${width} / ${height}` }}>
              <DiagramSvg data={data} />

              <svg
                ref={overlayRef}
                viewBox={`0 0 ${width} ${height}`}
                className="absolute inset-0 h-full w-full touch-none"
                onClick={handleCanvasClick}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {groups.map((group) => {
                  let { box } = groupLayout(group)
                  let isSelected = selection?.kind === 'group' && selection.id === group.id

                  return (
                    <g key={group.id}>
                      <rect
                        x={box.left}
                        y={box.top}
                        width={box.w}
                        height={box.h}
                        rx={8}
                        fill="transparent"
                        className={
                          isSelected ? 'cursor-grab stroke-blue-500' : 'cursor-grab stroke-transparent'
                        }
                        strokeWidth={2}
                        onPointerDown={(event) => startDrag(event, 'group', group.id, box)}
                      />
                      {isSelected && (
                        <rect
                          x={box.left + box.w - 7}
                          y={box.top + box.h - 7}
                          width={14}
                          height={14}
                          rx={2}
                          className="cursor-nwse-resize fill-blue-500"
                          onPointerDown={(event) => startResize(event, 'group', group.id, box)}
                        />
                      )}
                    </g>
                  )
                })}

                {edges.map((edge) => {
                  let fromNode = nodes.find((node) => node.id === edge.from)
                  let toNode = nodes.find((node) => node.id === edge.to)
                  if (!fromNode || !toNode) return null

                  let from = nodeLayout(fromNode).box
                  let to = nodeLayout(toNode).box
                  let isSelected = selection?.kind === 'edge' && selection.id === edge.id

                  return (
                    <line
                      key={edge.id}
                      x1={from.cx}
                      y1={from.cy}
                      x2={to.cx}
                      y2={to.cy}
                      strokeWidth={isSelected ? 4 : 10}
                      className={isSelected ? 'stroke-blue-500' : 'stroke-transparent'}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelection({ kind: 'edge', id: edge.id })
                      }}
                    />
                  )
                })}

                {nodes.map((node) => {
                  let { box } = nodeLayout(node)
                  let isSelected = selection?.kind === 'node' && selection.id === node.id
                  let isConnectSource = connectFrom === node.id

                  return (
                    <g key={node.id}>
                      <rect
                        x={box.left}
                        y={box.top}
                        width={box.w}
                        height={box.h}
                        rx={4}
                        fill="transparent"
                        className={
                          'cursor-grab ' +
                          (isSelected || isConnectSource ? 'stroke-blue-500' : 'stroke-transparent')
                        }
                        strokeWidth={2}
                        onPointerDown={(event) => startDrag(event, 'node', node.id, box)}
                        onClick={(event) => event.stopPropagation()}
                      />
                      {isSelected && (
                        <rect
                          x={box.left + box.w - 7}
                          y={box.top + box.h - 7}
                          width={14}
                          height={14}
                          rx={2}
                          className="cursor-nwse-resize fill-blue-500"
                          onPointerDown={(event) => startResize(event, 'node', node.id, box)}
                        />
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            <label className={`${labelClass} mt-3`}>
              Caption (shown under the diagram)
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className={inputClass}
              />
            </label>

            {warnings.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 rounded-md border-2 border-amber-500 bg-amber-50 p-3 pl-7 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="w-72 flex-shrink-0 overflow-y-auto">
            {selectedNode && (
              <div className="flex flex-col gap-3">
                <label className={labelClass}>
                  Title
                  <input
                    value={selectedNode.label || ''}
                    onChange={(event) => patchNode(selectedNode.id, { label: event.target.value })}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Subtitle
                  <input
                    value={selectedNode.sublabel || ''}
                    onChange={(event) =>
                      patchNode(selectedNode.id, { sublabel: event.target.value || undefined })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Body lines (one per line)
                  <textarea
                    rows={3}
                    value={(selectedNode.lines || []).join('\n')}
                    onChange={(event) => {
                      let lines = event.target.value.split('\n')
                      let hasContent = lines.some((line) => line.trim() !== '')
                      patchNode(selectedNode.id, { lines: hasContent ? lines : undefined })
                    }}
                    className={inputClass}
                  />
                </label>

                <div className={labelClass}>
                  Inner boxes
                  <div className="flex flex-col gap-2">
                    {(selectedNode.children || []).map((child, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <input
                          value={child.label || ''}
                          onChange={(event) => {
                            let next = [...selectedNode.children]
                            next[index] = { ...child, label: event.target.value }
                            updateChildren(selectedNode, next)
                          }}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          title="Arrives later"
                          aria-label="Arrives later"
                          onClick={() => {
                            let next = [...selectedNode.children]
                            next[index] = {
                              ...child,
                              state: child.state === 'later' ? undefined : 'later',
                            }
                            updateChildren(selectedNode, next)
                          }}
                          className={
                            'rounded border-2 border-zinc-900 px-1.5 text-xs dark:border-zinc-100 ' +
                            (child.state === 'later'
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300')
                          }
                        >
                          ⌛
                        </button>
                        <button
                          type="button"
                          aria-label="Remove inner box"
                          onClick={() =>
                            updateChildren(
                              selectedNode,
                              selectedNode.children.filter((_, i) => i !== index),
                            )
                          }
                          className="rounded border-2 border-zinc-900 bg-white px-1.5 text-xs text-zinc-700 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <ToolButton
                      onClick={() =>
                        updateChildren(selectedNode, [
                          ...(selectedNode.children || []),
                          { label: 'Step' },
                        ])
                      }
                    >
                      Add inner box
                    </ToolButton>
                  </div>
                </div>

                <div className={labelClass}>
                  Role
                  <div className="flex flex-wrap gap-2">
                    {SWATCH_ORDER.map((key) => (
                      <button
                        key={key}
                        type="button"
                        aria-label={NODE_STYLES[key].label}
                        title={NODE_STYLES[key].label}
                        onClick={() => patchNode(selectedNode.id, { role: key, color: undefined })}
                        style={{ backgroundColor: NODE_STYLES[key].swatch }}
                        className={
                          'h-6 w-6 rounded-full border-2 border-zinc-900 dark:border-zinc-100' +
                          ((selectedNode.role || selectedNode.color || 'grey') === key
                            ? ' ring-2 ring-blue-500 ring-offset-1'
                            : '')
                        }
                      />
                    ))}
                  </div>
                </div>

                <CheckField
                  label="Arrives later (dashed)"
                  checked={selectedNode.state === 'later'}
                  onChange={(event) =>
                    patchNode(selectedNode.id, {
                      state: event.target.checked ? 'later' : undefined,
                    })
                  }
                />

                <div className="flex gap-2">
                  <AutoNumberField
                    label="Width"
                    value={selectedNode.w}
                    onChange={(value) => patchNode(selectedNode.id, { w: value })}
                  />
                  <AutoNumberField
                    label="Height"
                    value={selectedNode.h}
                    onChange={(value) => patchNode(selectedNode.id, { h: value })}
                  />
                </div>

                <label className={labelClass}>
                  Detail (shown when clicked)
                  <textarea
                    rows={4}
                    value={selectedNode.detail || ''}
                    onChange={(event) =>
                      patchNode(selectedNode.id, { detail: event.target.value || undefined })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            )}

            {selectedGroup && (
              <div className="flex flex-col gap-3">
                <label className={labelClass}>
                  Panel label
                  <input
                    value={selectedGroup.label || ''}
                    onChange={(event) => patchGroup(selectedGroup.id, { label: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Drag the panel to move it, or its corner to resize. Panels only group boxes
                  visually — a box doesn’t have to belong to one.
                </p>
              </div>
            )}

            {selectedEdge && (
              <div className="flex flex-col gap-3">
                <label className={labelClass}>
                  Label
                  <input
                    value={selectedEdge.label || ''}
                    onChange={(event) => patchEdge(selectedEdge.id, { label: event.target.value })}
                    className={inputClass}
                  />
                </label>

                <div className="flex gap-2">
                  <label className={labelClass}>
                    Leaves from
                    <select
                      value={selectedEdge.fromSide || 'auto'}
                      onChange={(event) =>
                        patchEdge(selectedEdge.id, {
                          fromSide: event.target.value === 'auto' ? undefined : event.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      {SIDES.map((side) => (
                        <option key={side} value={side}>
                          {side}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Arrives at
                    <select
                      value={selectedEdge.toSide || 'auto'}
                      onChange={(event) =>
                        patchEdge(selectedEdge.id, {
                          toSide: event.target.value === 'auto' ? undefined : event.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      {SIDES.map((side) => (
                        <option key={side} value={side}>
                          {side}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <CheckField
                  label="Arrows both ways"
                  checked={selectedEdge.both}
                  onChange={(event) =>
                    patchEdge(selectedEdge.id, { both: event.target.checked || undefined })
                  }
                />
                <CheckField
                  label="Arrives later (dashed)"
                  checked={selectedEdge.state === 'later'}
                  onChange={(event) =>
                    patchEdge(selectedEdge.id, { state: event.target.checked ? 'later' : undefined })
                  }
                />
              </div>
            )}

            {!selection && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select a box, panel or arrow to edit it. Leave a box’s width and height on “auto”
                and it sizes itself around its text.
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
