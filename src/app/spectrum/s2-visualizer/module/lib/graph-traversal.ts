import type { GraphState } from "./graph-types"

export type IncomingAdjacency = Record<string, string[]>

export function createIncomingAdjacency(graph: GraphState): IncomingAdjacency {
  const incoming: IncomingAdjacency = {}
  for (const [source, targets] of Object.entries(graph.adjacencyList)) {
    for (const target of targets) (incoming[target] ??= []).push(source)
  }
  return incoming
}

export function findRelated(graph: GraphState, id: string, direction: "upstream" | "downstream", incoming = direction === "upstream" ? createIncomingAdjacency(graph) : undefined) {
  const result = new Set<string>()
  const queue = [id]
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!
    if (result.has(current)) continue
    result.add(current)
    const next = direction === "downstream"
      ? graph.adjacencyList[current] ?? []
      : incoming?.[current] ?? []
    queue.push(...next)
  }
  return result
}

export function collectRelated(graph: GraphState, nodeIds: Set<string>, start: string[], direction: "upstream" | "downstream") {
  const incoming = direction === "upstream" ? createIncomingAdjacency(graph) : undefined
  for (const id of start) for (const relatedId of findRelated(graph, id, direction, incoming)) nodeIds.add(relatedId)
}
