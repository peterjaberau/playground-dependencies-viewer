import type { Edge, Viewport } from "@xyflow/react"
import { assign, setup } from "xstate"
import { createFlowElements, type SpectrumFlowNode } from "../lib/flow-elements"
import type { GraphDataChangedEvent } from "../lib/display-graph-events"
import { EMPTY_GRAPH, type GraphState } from "../lib/graph-types"

const COLUMN_WIDTH = 650
const ROW_MARGIN = 4
const VALUE_HEIGHT = 16
const VALUE_MARGIN = 2
const VALUES_PADDING = 3

const nodeHeight = (node: GraphState["nodes"][string]) => {
  const rowCount = (node.value ?? "").split(":*;").length
  return rowCount * VALUE_HEIGHT + (VALUE_MARGIN * rowCount - 1) + VALUES_PADDING * 2
}

function calculateLayout(source: GraphState): GraphState {
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
    nodes.forEach((node) => { node.y += offset })
  })

  graph.width = maxWidth
  graph.height = Math.max(0, ...Object.values(graph.nodes).map((node) => node.y + nodeHeight(node)))
  return graph
}

export type GraphContext = { graph: GraphState; latestGraphData?: GraphDataChangedEvent; nodes: SpectrumFlowNode[]; edges: Edge[]; viewport: Viewport; selected: string[]; selectionAncestorNodeIds: string[]; selectionDescendentNodeIds: string[]; selectedChildDescendentNodeIds: string[]; selectionDescendentIntersectNodeIds: string[]; focusNodeIds: string[]; focusRequest: number; error: string }
export type GraphInput = Record<string, never>
type GraphEvent = { type: "graphData.published"; event: GraphDataChangedEvent } | { type: "viewport.changed"; viewport: Viewport } | { type: "node.moved"; id: string; position: { x: number; y: number } } | { type: "view.reset" }

const initialContext = (): GraphContext => ({ graph: EMPTY_GRAPH, nodes: [], edges: [], viewport: { x: 380, y: 130, zoom: .7 }, selected: [], selectionAncestorNodeIds: [], selectionDescendentNodeIds: [], selectedChildDescendentNodeIds: [], selectionDescendentIntersectNodeIds: [], focusNodeIds: [], focusRequest: 0, error: "" })

export const graphMachine = setup({
  types: {} as { context: GraphContext; input: GraphInput; events: GraphEvent },
  actions: {
    captureLatestGraphData: assign(({ event }) => event.type === "graphData.published" ? { latestGraphData: event.event } : {}),
    calculateGraphLayout: assign(({ event }) => event.type === "graphData.published" ? { graph: calculateLayout(event.event.graph), error: "" } : {}),
    createGraphFlow: assign(({ context, event }) => {
      if (event.type !== "graphData.published") return {}
      const { selected, selectionAncestorNodeIds, selectionDescendentNodeIds, selectedChildDescendentNodeIds, selectionDescendentIntersectNodeIds, focusNodeIds } = event.event
      return { selected, selectionAncestorNodeIds, selectionDescendentNodeIds, selectedChildDescendentNodeIds, selectionDescendentIntersectNodeIds, focusNodeIds, ...createFlowElements(context.graph, selected, selectionAncestorNodeIds, selectionDescendentNodeIds, selectedChildDescendentNodeIds, selectionDescendentIntersectNodeIds), focusRequest: focusNodeIds.length ? context.focusRequest + 1 : context.focusRequest }
    }),
    updateViewport: assign(({ event }) => event.type === "viewport.changed" ? { viewport: event.viewport } : {}),
    persistNodePosition: assign(({ context, event }) => {
      if (event.type !== "node.moved") return {}
      const graphNode = context.graph.nodes[event.id]
      if (!graphNode) return {}
      const graph = { ...context.graph, nodes: { ...context.graph.nodes, [event.id]: { ...graphNode, x: event.position.x, y: event.position.y } } }
      return { graph, nodes: context.nodes.map((node) => node.id === event.id ? { ...node, position: event.position } : node) }
    }),
    resetViewport: assign({ viewport: () => ({ x: 380, y: 130, zoom: .7 }) }),
  },
}).createMachine({
  id: "graph",
  initial: "ready",
  context: initialContext,
  states: {
    ready: { on: {
      "graphData.published": { actions: ["captureLatestGraphData", "calculateGraphLayout", "createGraphFlow"] },
      "viewport.changed": { actions: "updateViewport" },
      "node.moved": { actions: "persistNodePosition" },
      "view.reset": { actions: "resetViewport" },
    } },
  },
})
