import { createIncomingAdjacency, findRelated } from "./graph-traversal"
import type { GraphState } from "./graph-types"

export type IndirectRoute = {
  isActive: boolean
  nodeIds: Set<string>
}

/**
 * A selected route consists of direct selections plus nodes that actually
 * connect selected paths. It deliberately excludes unrelated ancestors and
 * descendants that merely happen to be visible in the graph.
 */
export function deriveSelectedRouteNodeIds(
  selected: string[],
  selectionAncestorNodeIds: string[],
  selectionDescendentNodeIds: string[],
  selectionDescendentIntersectNodeIds: string[],
) {
  const descendentIds = new Set(selectionDescendentNodeIds)
  return new Set([
    ...selected,
    ...selectionDescendentIntersectNodeIds,
    ...selectionAncestorNodeIds.filter((id) => descendentIds.has(id)),
  ])
}

/**
 * Activates the global indirect-route rule when a selected non-root
 * token/orphan has a non-root upstream node or at least one downstream node.
 * A root selection alone never activates the rule. When active, only the
 * supplied selected-route nodes remain fully opaque.
 */
export function deriveIndirectRoute(graph: GraphState, selected: string[], selectedRouteNodeIds: Iterable<string>): IndirectRoute {
  const incoming = createIncomingAdjacency(graph)
  const rootIds = new Set(Object.keys(graph.nodes).filter((id) => !(incoming[id] ?? []).length))
  const nodeIds = new Set<string>()
  let isActive = false

  for (const selectedId of selected) {
    const selectedNode = graph.nodes[selectedId]
    if (!selectedNode || selectedNode.type === "component") continue
    // Root selection alone is an entry point, not an indirect route. It must
    // never activate global dimming merely because it has visible children.
    if (rootIds.has(selectedId)) continue

    const upstream = findRelated(graph, selectedId, "upstream", incoming)
    const downstream = findRelated(graph, selectedId, "downstream")
    const hasNonRootUpstream = [...upstream].some((id) => id !== selectedId && !rootIds.has(id))
    const hasDownstream = downstream.size > 1
    if (!hasNonRootUpstream && !hasDownstream) continue

    isActive = true
  }

  if (isActive) {
    for (const id of selectedRouteNodeIds) nodeIds.add(id)
  }

  return { isActive, nodeIds }
}
