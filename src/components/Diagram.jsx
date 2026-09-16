'use client'

import { useState } from 'react'

import { DiagramSvg } from '@/components/DiagramSvg'

export function Diagram({ data }) {
  let [selectedNodeId, setSelectedNodeId] = useState(null)

  let nodes = data?.nodes || []
  let edges = data?.edges || []
  let selectedNode = nodes.find((node) => node.id === selectedNodeId)

  return (
    <div className="not-prose my-6">
      <DiagramSvg
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        onNodeClick={(node) =>
          node.detail && setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
        }
      />

      {selectedNode?.detail && (
        <div className="mt-3 rounded-md border-2 border-zinc-900 bg-white p-4 text-sm text-zinc-800 shadow-brutal-sm dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-brutal-sm-dark">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedNode.label}
          </p>
          <p className="mt-1">{selectedNode.detail}</p>
        </div>
      )}
    </div>
  )
}
