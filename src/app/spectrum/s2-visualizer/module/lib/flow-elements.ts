import type { Edge, Node } from "@xyflow/react"
import { GRAPH_EDGE_STYLE } from "./constants"
import { resolveGraphEdgeVisual } from "./graph-color-resolvers"
import type { GraphNode, GraphState } from "./graph-types"

export type SpectrumFlowNodeData = { graphNode: GraphNode; hasDownstream: boolean; isRoot: boolean; isSelected: boolean; isSelectionAncestor: boolean; isSelectionDescendent: boolean; isSelectionDescendentIntersect: boolean }
export type SpectrumFlowNode = Node<SpectrumFlowNodeData, "spectrumToken">

export function createFlowElements(graph: GraphState, selected: string[], selectionAncestorNodeIds: string[], selectionDescendentNodeIds: string[], selectedChildDescendentNodeIds: string[], selectionDescendentIntersectNodeIds: string[]) {
  const selectedIds = new Set(selected)
  const ancestorIds = new Set(selectionAncestorNodeIds)
  const descendentIds = new Set(selectionDescendentNodeIds)
  const selectedChildDescendentIds = new Set(selectedChildDescendentNodeIds)
  const descendentIntersectIds = new Set(selectionDescendentIntersectNodeIds)
  const focusIds = new Set([
    ...selectionAncestorNodeIds.filter((id) => descendentIds.has(id)),
    ...selectionDescendentIntersectNodeIds,
  ].filter((id) => !selectedIds.has(id)))
  const focusedOrSelectedIds = new Set([...focusIds, ...selectedIds])
  const isFocusMode = focusIds.size > 0
  const nodeIdsWithIncomingEdges = new Set(Object.values(graph.adjacencyList).flat())
  const nodes: SpectrumFlowNode[] = Object.values(graph.nodes).map((graphNode) => ({
    id: graphNode.id,
    type: "spectrumToken",
    position: { x: graphNode.x, y: graphNode.y },
    data: {
      graphNode,
      hasDownstream: (graph.adjacencyList[graphNode.id] ?? []).length > 0,
      isRoot: !nodeIdsWithIncomingEdges.has(graphNode.id),
      isSelected: selectedIds.has(graphNode.id),
      isSelectionAncestor: ancestorIds.has(graphNode.id),
      isSelectionDescendent: descendentIds.has(graphNode.id),
      isSelectionDescendentIntersect: descendentIntersectIds.has(graphNode.id),
    },
  }))
  const edges: Edge[] = Object.entries(graph.adjacencyList).flatMap(([source, targets]) => {
    const sourceNode = graph.nodes[source]
    if (!sourceNode) return []
    return targets.map((target): Edge => {
      const isOnAncestorPath = ancestorIds.has(source) && ancestorIds.has(target)
      const isOnDescendentPath = descendentIds.has(source) && descendentIds.has(target)
      const isOnSelectedChildDescendentPath = selectedChildDescendentIds.has(source) && selectedChildDescendentIds.has(target)
      const isSelectionConnection = isOnAncestorPath && isOnDescendentPath
      const isFaded = isFocusMode && !(focusedOrSelectedIds.has(source) && focusedOrSelectedIds.has(target))
      const isHighlighted = isSelectionConnection || isOnAncestorPath || isOnSelectedChildDescendentPath
      const visual = resolveGraphEdgeVisual({ sourceType: sourceNode.type, isOnSelectedChildDescendentPath, isSelectionConnection, isOnAncestorPath, isOnDescendentPath, isFaded, isHighlighted })
      return {
        id: `${source}->${target}`,
        source,
        target,
        type: "default",
        zIndex: visual.zIndex,
        style: { stroke: visual.color, strokeWidth: GRAPH_EDGE_STYLE.strokeWidth, opacity: 1 },
      }
    })
  })
  return { nodes, edges }
}
