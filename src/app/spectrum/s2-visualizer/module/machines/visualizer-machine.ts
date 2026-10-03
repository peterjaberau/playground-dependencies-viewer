import type { Edge, Viewport } from "@xyflow/react"
import { assign, sendParent, setup } from "xstate"
import { createFlowElements, type SpectrumFlowNode } from "../lib/flow-elements"
import { EMPTY_GRAPH, type GraphState } from "../lib/graph-types"

export type VisualizerContext = { graph: GraphState; nodes: SpectrumFlowNode[]; edges: Edge[]; viewport: Viewport; selected: string[]; related: string[]; focusNodeIds: string[]; focusRequest: number; error: string }
export type VisualizerInput = Record<string, never>
type VisualizerEvent = { type: "layout.completed"; graph: GraphState; selected: string[]; related: string[]; focusNodeIds: string[] } | { type: "viewport.changed"; viewport: Viewport } | { type: "node.moved"; id: string; position: { x: number; y: number } } | { type: "view.reset" }

const initialContext = (): VisualizerContext => ({ graph: EMPTY_GRAPH, nodes: [], edges: [], viewport: { x: 380, y: 130, zoom: .7 }, selected: [], related: [], focusNodeIds: [], focusRequest: 0, error: "" })

export const visualizerMachine = setup({
  types: {} as { context: VisualizerContext; input: VisualizerInput; events: VisualizerEvent },
  actions: {
    applyLayout: assign(({ context, event }) => {
      if (event.type !== "layout.completed") return {}
      const graph = event.graph
      const { selected, related, focusNodeIds } = event
      return {
        graph,
        selected,
        related,
        focusNodeIds,
        ...createFlowElements(graph, selected, related),
        focusRequest: focusNodeIds.length ? context.focusRequest + 1 : context.focusRequest,
      }
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
    notifyRootReady: sendParent({ type: "visualizer.ready" }),
  },
}).createMachine({
  id: "visualizer",
  initial: "ready",
  context: initialContext,
  entry: "notifyRootReady",
  states: {
    ready: { on: {
      "layout.completed": { actions: "applyLayout" },
      "viewport.changed": { actions: "updateViewport" },
      "node.moved": { actions: "persistNodePosition" },
      "view.reset": { actions: "resetViewport" },
    } },
  },
})
