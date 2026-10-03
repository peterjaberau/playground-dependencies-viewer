import type { Edge, Node } from "@xyflow/react"
import { GRAPH_EDGE_COLORS, GRAPH_EDGE_STYLE } from "./constants"
import type { GraphNode, GraphState } from "./graph-types"

export type SpectrumFlowNodeData = { graphNode: GraphNode; isSelected: boolean; isSelectionAncestor: boolean; isSelectionDescendent: boolean; isSelectionDescendentIntersect: boolean }
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
  const defaultEdgeColor = GRAPH_EDGE_STYLE.color ?? GRAPH_EDGE_COLORS.default
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
    const isOnSelectedChildDescendentPath = selectedChildDescendentIds.has(source) && selectedChildDescendentIds.has(target)
    const isSelectionConnection = isOnAncestorPath && isOnDescendentPath
    const isFaded = isFocusMode && !(focusedOrSelectedIds.has(source) && focusedOrSelectedIds.has(target))
    const stroke = isOnSelectedChildDescendentPath
      ? GRAPH_EDGE_COLORS.selectedChildDescendentPath
      : isSelectionConnection
      ? GRAPH_EDGE_COLORS.selectionConnection
      : isOnAncestorPath
        ? GRAPH_EDGE_COLORS.ancestorPath
        : isOnDescendentPath
          ? GRAPH_EDGE_COLORS.descendentPath
          : defaultEdgeColor
    return {
      id: `${source}->${target}`,
      source,
      target,
      type: "default",
      zIndex: isSelectionConnection ? GRAPH_EDGE_STYLE.highlightedZIndex : GRAPH_EDGE_STYLE.normalZIndex,
      style: { stroke, strokeWidth: GRAPH_EDGE_STYLE.strokeWidth, opacity: isFaded ? GRAPH_EDGE_STYLE.fadedOpacity : 1 },
    }
  }))
  return { nodes, edges }
}
