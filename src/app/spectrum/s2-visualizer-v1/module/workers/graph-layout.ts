import type { GraphState } from "../graph"

type TraversalItem = [id: string, depth: number]

const COLUMN_WIDTH = 650
const ROW_MARGIN = 4
const VALUE_HEIGHT = 16
const VALUE_MARGIN = 2
const VALUES_PADDING = 3

// The original STVT layout algorithm, translated to work with GraphState
// instead of the previous GraphModel class API.
function layout(source: GraphState): GraphState {
  const graph = structuredClone(source) as GraphState
  const adjacencyTargets = new Set(Object.values(graph.adjacencyList).flat())
  const roots = Object.keys(graph.nodes)
    .filter((id) => !adjacencyTargets.has(id))
    .sort((left, right) => {
      const leftNode = graph.nodes[left]!
      const rightNode = graph.nodes[right]!
      if (leftNode.type === rightNode.type) return left.localeCompare(right)
      return leftNode.type === "component" ? -1 : 1
    })
  const pending: TraversalItem[] = roots.map((id) => [id, 0])
  const columnAssignments: string[][] = []
  const insertionPoints: number[] = []
  const validInsertionPoints: Record<string, number[]> = {}
  let maxWidth = 0
  let maxHeight = 0

  while (pending.length) {
    const [id, depth] = pending.shift()!
    const node = graph.nodes[id]
    if (!node) continue
    const adjacencies = [...(graph.adjacencyList[id] ?? [])].sort()
    pending.push(...adjacencies.map((target) => [target, depth + 1] as TraversalItem))
    insertionPoints[depth] ??= 0
    columnAssignments[depth] ??= []
    node.x = depth * COLUMN_WIDTH
    node.y = insertionPoints[depth]!
    const rowCount = (node.value ?? "").split(":*;").length
    insertionPoints[depth]! += ROW_MARGIN + rowCount * VALUE_HEIGHT + (VALUE_MARGIN * rowCount - 1) + VALUES_PADDING * 2

    if (!columnAssignments[depth]!.includes(id)) {
      columnAssignments[depth]!.push(id)
      for (let column = 0; column < depth; column++) {
        const earlierIndex = columnAssignments[column]!.indexOf(id)
        if (earlierIndex >= 0) columnAssignments[column]!.splice(earlierIndex, 1)
      }
      validInsertionPoints[id] = []
    }
    ;(validInsertionPoints[id] ??= []).push(node.y)
    maxWidth = Math.max(maxWidth, node.x)
    maxHeight = Math.max(maxHeight, node.y)
  }

  for (const [id, points] of Object.entries(validInsertionPoints)) {
    if (points.length > 2) graph.nodes[id]!.y = points[Math.floor(points.length / 2)]!
  }

  let priorAncestorPositions = [0]
  columnAssignments.forEach((assignments, column) => {
    const ancestorAverage = priorAncestorPositions.reduce((sum, value) => sum + value, 0) / priorAncestorPositions.length
    priorAncestorPositions = []
    const offset = column === 0 ? 0 : ancestorAverage - insertionPoints[column]! / 2
    assignments.forEach((id) => {
      const node = graph.nodes[id]!
      node.y += offset
      maxHeight = Math.max(maxHeight, node.y)
      if (graph.adjacencyList[id]) priorAncestorPositions.push(node.y)
    })
  })

  graph.width = maxWidth
  graph.height = maxHeight
  return graph
}

self.addEventListener("message", (event: MessageEvent<GraphState>) => self.postMessage(layout(event.data)))
