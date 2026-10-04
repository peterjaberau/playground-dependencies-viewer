import type { GraphState } from "./graph-types"

const COLUMN_WIDTH = 650
const ROW_MARGIN = 4
const VALUE_HEIGHT = 16
const VALUE_MARGIN = 2
const VALUES_PADDING = 3

const nodeHeight = (node: GraphState["nodes"][string]) => {
  const rowCount = (node.value ?? "").split(":*;").length
  return rowCount * VALUE_HEIGHT + (VALUE_MARGIN * rowCount - 1) + VALUES_PADDING * 2
}

/**
 * Produces a stable, non-overlapping layered layout for the currently visible
 * domain graph. Columns are centered around the incoming parent connections
 * without changing their sorted order within a column.
 */
export function calculateGraphLayout(source: GraphState): GraphState {
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

  for (let cursor = 0; cursor < pending.length; cursor++) {
    const [id, depth] = pending[cursor]!
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
  }

  for (const [id, points] of Object.entries(validInsertionPoints)) {
    if (points.length > 2) graph.nodes[id]!.y = points[Math.floor(points.length / 2)]!
  }

  const parentIdsByColumn = new Map<number, Set<string>>()
  for (const [sourceId, targets] of Object.entries(graph.adjacencyList)) {
    const source = graph.nodes[sourceId]
    if (!source) continue
    for (const targetId of targets) {
      const target = graph.nodes[targetId]
      if (!target || source.x >= target.x) continue
      const column = target.x / COLUMN_WIDTH
      const parentIds = parentIdsByColumn.get(column) ?? new Set<string>()
      parentIds.add(sourceId)
      parentIdsByColumn.set(column, parentIds)
    }
  }

  columnAssignments.forEach((assignments, column) => {
    if (column === 0 || !assignments.length) return
    const nodes = assignments.map((id) => graph.nodes[id]!).filter(Boolean)
    const parentCenters = [...(parentIdsByColumn.get(column) ?? [])].map((id) => {
      const parent = graph.nodes[id]!
      return parent.y + nodeHeight(parent) / 2
    })
    if (!parentCenters.length) return
    const childTop = Math.min(...nodes.map((node) => node.y))
    const childBottom = Math.max(...nodes.map((node) => node.y + nodeHeight(node)))
    const parentCenter = parentCenters.reduce((sum, value) => sum + value, 0) / parentCenters.length
    const offset = parentCenter - (childTop + childBottom) / 2
    nodes.forEach((node) => {
      node.y += offset
    })
  })

  graph.width = maxWidth
  graph.height = Math.max(0, ...Object.values(graph.nodes).map((node) => node.y + nodeHeight(node)))
  return graph
}
