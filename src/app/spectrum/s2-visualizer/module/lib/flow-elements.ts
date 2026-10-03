import type { Edge, Node } from "@xyflow/react"
import type { GraphNode, GraphState } from "./graph-types"

export type SpectrumFlowNodeData = { graphNode: GraphNode; isSelected: boolean; isSelectionAncestor: boolean; isSelectionDescendent: boolean; isSelectionDescendentIntersect: boolean }
export type SpectrumFlowNode = Node<SpectrumFlowNodeData, "spectrumToken">

export function createFlowElements(graph: GraphState, selected: string[], selectionAncestorNodeIds: string[], selectionDescendentNodeIds: string[], selectionDescendentIntersectNodeIds: string[]) {
  const selectedIds = new Set(selected)
  const ancestorIds = new Set(selectionAncestorNodeIds)
  const descendentIds = new Set(selectionDescendentNodeIds)
  const descendentIntersectIds = new Set(selectionDescendentIntersectNodeIds)
  const focusIds = new Set([
    ...selectionAncestorNodeIds.filter((id) => descendentIds.has(id)),
    ...selectionDescendentIntersectNodeIds,
  ].filter((id) => !selectedIds.has(id)))
  const focusedOrSelectedIds = new Set([...focusIds, ...selectedIds])
  const isFocusMode = focusIds.size > 0
  const nodes: SpectrumFlowNode[] = Object.values(graph.nodes).map((graphNode) => ({
    id: graphNode.id,
    type: "spectrumToken",
    position: { x: graphNode.x, y: graphNode.y },
    data: {
      graphNode,
      isSelected: selectedIds.has(graphNode.id),
      isSelectionAncestor: ancestorIds.has(graphNode.id),
      isSelectionDescendent: descendentIds.has(graphNode.id),
      isSelectionDescendentIntersect: descendentIntersectIds.has(graphNode.id),
    },
  }))
  const edges: Edge[] = Object.entries(graph.adjacencyList).flatMap(([source, targets]) => targets.map((target) => {
    const isOnAncestorPath = ancestorIds.has(source) && ancestorIds.has(target)
    const isOnDescendentPath = descendentIds.has(source) && descendentIds.has(target)
    const isSelectionConnection = isOnAncestorPath && isOnDescendentPath
    const isFaded = isFocusMode && !(focusedOrSelectedIds.has(source) && focusedOrSelectedIds.has(target))
    const stroke = isSelectionConnection ? "#f97316" : isOnAncestorPath ? "#a855f7" : isOnDescendentPath ? "#ec4899" : "#94a3b8"
    return {
      id: `${source}->${target}`,
      source,
      target,
      type: "default",
      style: { stroke, strokeWidth: 2, opacity: isFaded ? .3 : 1 },
    }
  }))
  return { nodes, edges }
}
