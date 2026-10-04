import type { GraphNode, GraphState } from "./graph-types"
import { createIncomingAdjacency } from "./graph-traversal"

type GraphFragment = { nodeIds: Set<string>; edgeIds: Set<string> }

function createFragment(graph: GraphState, start: string[], direction: "upstream" | "downstream", incoming = direction === "upstream" ? createIncomingAdjacency(graph) : undefined): GraphFragment {
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()
  const pending = [...start]

  for (let cursor = 0; cursor < pending.length; cursor++) {
    const current = pending[cursor]!
    if (nodeIds.has(current) || !graph.nodes[current]) continue
    nodeIds.add(current)
    const adjacentIds = direction === "downstream"
      ? graph.adjacencyList[current] ?? []
      : incoming?.[current] ?? []
    for (const adjacentId of adjacentIds) {
      const source = direction === "downstream" ? current : adjacentId
      const target = direction === "downstream" ? adjacentId : current
      edgeIds.add(`${source}->${target}`)
      if (!nodeIds.has(adjacentId)) pending.push(adjacentId)
    }
  }

  return { nodeIds, edgeIds }
}

function addFragment(target: GraphFragment, source: GraphFragment) {
  source.nodeIds.forEach((id) => target.nodeIds.add(id))
  source.edgeIds.forEach((id) => target.edgeIds.add(id))
}

function subgraph(graph: GraphState, fragment: GraphFragment): GraphState {
  const { nodeIds, edgeIds } = fragment
  const nodes = Object.fromEntries([...nodeIds].map((id) => {
    const node = graph.nodes[id]!
    return [id, { ...node, ...(node.adjacencyLabels ? { adjacencyLabels: { ...node.adjacencyLabels } } : {}) } as GraphNode]
  })) as Record<string, GraphNode>
  const adjacencyList = Object.fromEntries([...nodeIds]
    .map((id) => [id, (graph.adjacencyList[id] ?? []).filter((target) => edgeIds.has(`${id}->${target}`))] as const)
    .filter(([, targets]) => targets.length)) as Record<string, string[]>
  return { width: 0, height: 0, nodes, adjacencyList }
}

/**
 * Mirrors GraphController.updateDisplayGraph from the original application.
 *
 * The base graph contributes root nodes and root-to-root edges only. Crucially,
 * it does not connect a visible orphan category (`-*`) to a token merely
 * because that token was revealed by a selected component. That connection is
 * contributed only by the token's upstream fragment after that token itself is
 * selected.
 */
export function createDisplayGraph(graph: GraphState, selected: string[]): GraphState {
  const baseNodeIds = new Set(Object.values(graph.nodes).filter((node) => node.type !== "token").map((node) => node.id))
  const display = { nodeIds: baseNodeIds, edgeIds: new Set<string>() }
  for (const [source, targets] of Object.entries(graph.adjacencyList)) {
    if (!baseNodeIds.has(source)) continue
    for (const target of targets) if (baseNodeIds.has(target)) display.edgeIds.add(`${source}->${target}`)
  }
  const components = selected.filter((id) => graph.nodes[id]?.type === "component")
  const tokens = selected.filter((id) => graph.nodes[id]?.type !== "component")
  const incoming = createIncomingAdjacency(graph)
  addFragment(display, createFragment(graph, components, "downstream"))
  addFragment(display, createFragment(graph, tokens, "upstream", incoming))
  addFragment(display, createFragment(graph, tokens, "downstream"))
  return subgraph(graph, display)
}
