import { GRAPH_EDGE_COLORS, GRAPH_EDGE_STYLE, GRAPH_NODE_COLORS } from "./constants"
import type { GraphNode } from "./graph-types"

export type GraphNodeColorRole = keyof typeof GRAPH_NODE_COLORS
export type GraphEdgeColorRole = keyof typeof GRAPH_EDGE_COLORS

type NodeColorInput = {
  type: GraphNode["type"]
  isSelected: boolean
  isSelectionAncestor: boolean
  isSelectionDescendent: boolean
  isSelectionDescendentIntersect: boolean
}

/**
 * Ordered to match the original visualizer's selection precedence. Keep this
 * ordering here rather than duplicating it in the React node component.
 */
export function resolveGraphNodeColorRole(input: NodeColorInput): GraphNodeColorRole {
  if (input.isSelected) return "selected"
  if (input.isSelectionDescendentIntersect || (input.isSelectionAncestor && input.isSelectionDescendent)) return "selectionConnection"
  if (input.isSelectionDescendent) return "descendentPath"
  if (input.isSelectionAncestor) return "ancestorPath"
  if (input.type === "component") return "component"
  if (input.type === "orphan-category") return "orphanCategory"
  return "token"
}

export function resolveGraphNodeColor(input: NodeColorInput) {
  return GRAPH_NODE_COLORS[resolveGraphNodeColorRole(input)]
}

type EdgeColorInput = {
  isOnSelectedChildDescendentPath: boolean
  isSelectionConnection: boolean
  isOnAncestorPath: boolean
  isOnDescendentPath: boolean
}

/** Edge-role precedence is centralized so color and z-index cannot diverge. */
export function resolveGraphEdgeColorRole(input: EdgeColorInput): GraphEdgeColorRole {
  if (input.isOnSelectedChildDescendentPath) return "selectedChildDescendentPath"
  if (input.isSelectionConnection) return "selectionConnection"
  if (input.isOnAncestorPath) return "ancestorPath"
  if (input.isOnDescendentPath) return "descendentPath"
  return "default"
}

export function resolveGraphEdgeVisual(input: EdgeColorInput) {
  const role = resolveGraphEdgeColorRole(input)
  const color = role === "default"
    ? GRAPH_EDGE_STYLE.color ?? GRAPH_EDGE_COLORS.default
    : GRAPH_EDGE_COLORS[role]
  return {
    role,
    color,
    zIndex: role === "selectionConnection" ? GRAPH_EDGE_STYLE.highlightedZIndex : GRAPH_EDGE_STYLE.normalZIndex,
  }
}
