import type { Edge, Node } from "@xyflow/react"
import type { GraphNode, GraphState } from "./graph-types"

export type SpectrumFlowNodeData = { graphNode: GraphNode; isSelected: boolean; isRelated: boolean }
export type SpectrumFlowNode = Node<SpectrumFlowNodeData, "spectrumToken">

export function createFlowElements(graph: GraphState, selected: string[], related: string[]) {
  const selectedIds = new Set(selected)
  const relatedIds = new Set(related)
  const nodes: SpectrumFlowNode[] = Object.values(graph.nodes).map((graphNode) => ({
    id: graphNode.id,
    type: "spectrumToken",
    position: { x: graphNode.x, y: graphNode.y },
    data: { graphNode, isSelected: selectedIds.has(graphNode.id), isRelated: relatedIds.has(graphNode.id) },
  }))
  const edges: Edge[] = Object.entries(graph.adjacencyList).flatMap(([source, targets]) => targets.map((target) => ({
    id: `${source}->${target}`,
    source,
    target,
    type: "default",
    style: { stroke: selectedIds.has(source) || selectedIds.has(target) ? "#7e22ce" : "#94a3b8", strokeWidth: 2 },
  })))
  return { nodes, edges }
}
