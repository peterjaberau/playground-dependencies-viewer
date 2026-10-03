import type { GraphState } from "../lib/graph-types"

const COLUMN_WIDTH = 650
const ROW_MARGIN = 4
const VALUE_HEIGHT = 16
const VALUE_MARGIN = 2
const VALUES_PADDING = 3

const nodeHeight = (node: GraphState["nodes"][string]) => {
  const rowCount = (node.value ?? "").split(":*;").length
  return rowCount * VALUE_HEIGHT + (VALUE_MARGIN * rowCount - 1) + VALUES_PADDING * 2
}

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
  const pending: Array<[id: string, depth: number]> = roots.map((id) => [id, 0])
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
    pending.push(...adjacencies.map((target) => [target, depth + 1] as [string, number]))
    insertionPoints[depth] ??= 0
    columnAssignments[depth] ??= []
    node.x = depth * COLUMN_WIDTH
    node.y = insertionPoints[depth]!
    insertionPoints[depth]! += ROW_MARGIN + nodeHeight(node)

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

  // Keep the sorted, non-overlapping order above. Then translate an entire
  // child layer to the centroid of the actual incoming edges. This is a graph
  // invariant, not a selection- or level-specific rule: all children stay in
  // their own ordered column while their visual centre aligns with the arrows
  // that enter that column.
  columnAssignments.forEach((assignments, column) => {
    if (column === 0 || !assignments.length) return
    const nodes = assignments.map((id) => graph.nodes[id]!).filter(Boolean)
    const childIds = new Set(assignments)
    const parentCenters = Object.entries(graph.adjacencyList).flatMap(([sourceId, targets]) => {
      const source = graph.nodes[sourceId]
      if (!source || source.x >= column * COLUMN_WIDTH || !targets.some((id) => childIds.has(id))) return []
      return [source.y + nodeHeight(source) / 2]
    })
    if (!parentCenters.length) return

    const childTop = Math.min(...nodes.map((node) => node.y))
    const childBottom = Math.max(...nodes.map((node) => node.y + nodeHeight(node)))
    const parentCenter = parentCenters.reduce((sum, value) => sum + value, 0) / parentCenters.length
    const childCenter = (childTop + childBottom) / 2
    const offset = parentCenter - childCenter

    nodes.forEach((node) => { node.y += offset })
  })

  maxHeight = Math.max(...Object.values(graph.nodes).map((node) => node.y + nodeHeight(node)))

  graph.width = maxWidth
  graph.height = maxHeight
  return graph
}

self.addEventListener("message", (event: MessageEvent<GraphState>) => self.postMessage(layout(event.data)))
