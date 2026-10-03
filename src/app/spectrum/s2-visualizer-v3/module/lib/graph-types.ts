export type GraphNodeType = "token" | "component" | "orphan-category"

export type GraphNode = {
  type: GraphNodeType
  id: string
  x: number
  y: number
  value?: string
  adjacencyLabels?: Record<string, string>
}

export type GraphState = {
  width: number
  height: number
  nodes: Record<string, GraphNode>
  adjacencyList: Record<string, string[]>
}

export const EMPTY_GRAPH: GraphState = { width: 0, height: 0, nodes: {}, adjacencyList: {} }
