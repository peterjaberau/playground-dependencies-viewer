import type { GraphNode, GraphState } from "./graph-types"
import { collectRelated } from "./graph-traversal"

function subgraph(graph: GraphState, nodeIds: Set<string>): GraphState {
  const nodes = Object.fromEntries([...nodeIds].map((id) => {
    const node = graph.nodes[id]!
    return [id, { ...node, ...(node.adjacencyLabels ? { adjacencyLabels: { ...node.adjacencyLabels } } : {}) } as GraphNode]
  })) as Record<string, GraphNode>
  const adjacencyList = Object.fromEntries([...nodeIds]
    .map((id) => [id, (graph.adjacencyList[id] ?? []).filter((target) => nodeIds.has(target))] as const)
    .filter(([, targets]) => targets.length)) as Record<string, string[]>
  return { width: 0, height: 0, nodes, adjacencyList }
}

/** Mirrors the original visualizer: roots persist while selections expand them. */
export function createDisplayGraph(graph: GraphState, selected: string[]): GraphState {
  const nodeIds = new Set(Object.values(graph.nodes).filter((node) => node.type !== "token").map((node) => node.id))
  const components = selected.filter((id) => graph.nodes[id]?.type === "component")
  const tokens = selected.filter((id) => graph.nodes[id]?.type !== "component")
  collectRelated(graph, nodeIds, components, "downstream")
  collectRelated(graph, nodeIds, tokens, "upstream")
  collectRelated(graph, nodeIds, tokens, "downstream")
  return subgraph(graph, nodeIds)
}
