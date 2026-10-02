import type { Edge, Viewport } from "@xyflow/react"
import { assign, sendTo, setup } from "xstate"
import { createFlowElements, type SpectrumFlowNode } from "../lib/flow-elements"
import { EMPTY_GRAPH, type GraphState } from "../lib/graph-types"
import { layoutGraphActor } from "../lib/layout-graph-actor"

export type VisualizerContext = { graph: GraphState; nodes: SpectrumFlowNode[]; edges: Edge[]; viewport: Viewport; selected: string[]; related: string[]; error: string; graphEvents: any }
export type VisualizerInput = { graphEvents: any }
type VisualizerEvent = { type: "graph.updated"; graph: GraphState; selected: string[]; related: string[] } | { type: "viewport.changed"; viewport: Viewport } | { type: "node.moved"; id: string; position: { x: number; y: number } } | { type: "view.reset" }

const initialContext = ({ input }: { input: VisualizerInput }): VisualizerContext => ({ graph: EMPTY_GRAPH, nodes: [], edges: [], viewport: { x: 380, y: 130, zoom: .7 }, selected: [], related: [], error: "", graphEvents: input.graphEvents })

export const visualizerMachine = setup({
  types: {} as { context: VisualizerContext; input: VisualizerInput; events: VisualizerEvent },
  actors: { layoutGraph: layoutGraphActor },
  actions: {
    stageGraph: assign(({ event }) => event.type === "graph.updated" ? { graph: event.graph, selected: event.selected, related: event.related, error: "" } : {}),
    applyLayout: assign(({ context, event }) => {
      const graph = (event as unknown as { output: GraphState }).output
      return { graph, ...createFlowElements(graph, context.selected, context.related) }
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
    recordLayoutError: assign(({ event }) => { const error = (event as { error?: unknown }).error; return { error: error instanceof Error ? error.message : "Unable to lay out the graph." } }),
    subscribeToGraphEvents: sendTo(({ context }) => context.graphEvents, ({ self }) => ({ type: "displayGraph.subscribed", subscriber: self })),
  },
}).createMachine({
  id: "visualizer",
  initial: "ready",
  context: initialContext,
  entry: "subscribeToGraphEvents",
  states: {
    ready: { on: {
      "graph.updated": { target: "layout", actions: "stageGraph" },
      "viewport.changed": { actions: "updateViewport" },
      "node.moved": { actions: "persistNodePosition" },
      "view.reset": { actions: "resetViewport" },
    } },
    layout: {
      on: { "graph.updated": { target: "layout", reenter: true, actions: "stageGraph" } },
      invoke: { src: "layoutGraph", input: ({ context }) => context.graph, onDone: { target: "ready", actions: "applyLayout" }, onError: { target: "ready", actions: "recordLayoutError" } },
    },
  },
})
