'use client'

import { useEffect, useRef, useState } from 'react'

import { DiagramSvg } from '@/components/DiagramSvg'
import { scrollMinWidth } from '@/lib/diagramLayout'

export function Diagram({ data }) {
  let [selectedNodeId, setSelectedNodeId] = useState(null)
  let [overflowing, setOverflowing] = useState(false)
  let scrollerRef = useRef(null)

  let nodes = data?.nodes || []
  let selectedNode = nodes.find((node) => node.id === selectedNodeId)
  let minWidth = scrollMinWidth(data)

  // A diagram wider than the prose column scrolls sideways rather than
  // scaling its text into illegibility — but the "scroll sideways" hint only
  // earns its place when the canvas actually is cut off right now.
  useEffect(() => {
    let element = scrollerRef.current
    if (!element || !minWidth) return

    let check = () => setOverflowing(element.scrollWidth > element.clientWidth + 1)
    check()

    let observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  }, [minWidth])

  return (
    <figure className="not-prose my-6">
      <div ref={scrollerRef} className={minWidth ? 'overflow-x-auto' : undefined}>
        <div style={minWidth ? { minWidth } : undefined}>
          <DiagramSvg
            data={data}
            selectedNodeId={selectedNodeId}
            onNodeClick={(node) =>
              node.detail && setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
            }
          />
        </div>
      </div>

      {selectedNode?.detail && (
        <div className="mt-3 rounded-md border-2 border-zinc-900 bg-white p-4 text-sm text-zinc-800 shadow-brutal-sm dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-brutal-sm-dark">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedNode.label}
          </p>
          <p className="mt-1">{selectedNode.detail}</p>
        </div>
      )}

      {(data?.caption || overflowing) && (
        <figcaption className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {data?.caption}
          {overflowing && (
            <span className={data?.caption ? 'mt-1 block text-xs' : 'text-xs'}>
              Scroll sideways to see the whole diagram.
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
