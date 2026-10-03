import type { GraphState } from "./graph-types"

export function findRelated(graph: GraphState, id: string, direction: "upstream" | "downstream") {
  const result = new Set<string>()
  const queue = [id]
  while (queue.length) {
    const current = queue.shift()!
    if (result.has(current)) continue
    result.add(current)
    const next = direction === "downstream"
      ? graph.adjacencyList[current] ?? []
      : Object.entries(graph.adjacencyList).filter(([, targets]) => targets.includes(current)).map(([from]) => from)
    queue.push(...next)
  }
  return result
}

export function collectRelated(graph: GraphState, nodeIds: Set<string>, start: string[], direction: "upstream" | "downstream") {
  for (const id of start) for (const relatedId of findRelated(graph, id, direction)) nodeIds.add(relatedId)
}
