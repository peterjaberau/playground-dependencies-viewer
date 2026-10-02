import type { GraphState } from "../graph"

const columnWidth = 650
const rowMargin = 12
const nodeHeight = (node: GraphState["nodes"][string]) => Math.max(36, (node.value?.split(":*;").filter(Boolean).length ?? 0) * 20 + 32)

function layout(source: GraphState): GraphState {
  const graph: GraphState = structuredClone(source)
  const targets = new Set(Object.values(graph.adjacencyList).flat())
  const queue: Array<[string, number]> = Object.keys(graph.nodes).filter((id) => !targets.has(id)).map((id) => [id, 0])
  const visited = new Set<string>()
  const columnY: number[] = []
  while (queue.length) {
    const [id, column] = queue.shift()!
    if (visited.has(id) || !graph.nodes[id]) continue
    visited.add(id)
    const node = graph.nodes[id]
    node.x = column * columnWidth
    node.y = columnY[column] ?? 0
    columnY[column] = node.y + nodeHeight(node) + rowMargin
    for (const target of graph.adjacencyList[id] ?? []) queue.push([target, column + 1])
  }
  graph.width = Math.max(0, ...Object.values(graph.nodes).map((node) => node.x)) + 450
  graph.height = Math.max(0, ...Object.values(graph.nodes).map((node) => node.y + nodeHeight(node)))
  return graph
}

self.addEventListener("message", (event: MessageEvent<GraphState>) => self.postMessage(layout(event.data)))
