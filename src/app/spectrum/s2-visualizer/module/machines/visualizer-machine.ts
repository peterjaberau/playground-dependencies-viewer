import { assign, fromCallback, setup } from "xstate"
import type { DisplayGraphEventPublisher } from "../lib/display-graph-events"
import { EMPTY_GRAPH, type GraphState } from "../lib/graph-types"
import { layoutGraphActor } from "../lib/layout-graph-actor"

export type VisualizerContext = { graph: GraphState; pan: { x: number; y: number }; zoom: number; error: string; displayGraphPublisher: DisplayGraphEventPublisher }
export type VisualizerInput = { displayGraphPublisher: DisplayGraphEventPublisher }

const initialContext = ({ input }: { input: VisualizerInput }): VisualizerContext => ({ graph: EMPTY_GRAPH, pan: { x: 380, y: 130 }, zoom: .7, error: "", displayGraphPublisher: input.displayGraphPublisher })

const observeDisplayGraph = fromCallback(({ input, sendBack }: { input: { publisher: DisplayGraphEventPublisher }; sendBack: (event: { type: "graph.updated"; graph: GraphState }) => void }) => {
  const subscription = input.publisher.on("displayGraph.changed", (event) => sendBack({ type: "graph.updated", graph: event.graph }))
  const currentGraph = input.publisher.getSnapshot().context.displayGraph
  if (Object.keys(currentGraph.nodes).length) sendBack({ type: "graph.updated", graph: currentGraph })
  return () => subscription.unsubscribe()
})

export const visualizerMachine = setup({
  types: {} as { context: VisualizerContext; input: VisualizerInput; events: { type: "graph.updated"; graph: GraphState } | { type: "view.changed"; pan: { x: number; y: number }; zoom: number } | { type: "view.panned"; delta: { x: number; y: number } } | { type: "node.moved"; id: string; delta: { x: number; y: number } } | { type: "view.reset" } },
  actors: { layoutGraph: layoutGraphActor, observeDisplayGraph },
  actions: {
    updateGraph: assign(({ event }) => event.type === "graph.updated" ? { graph: event.graph } : {}),
    updateView: assign(({ event }) => event.type === "view.changed" ? { pan: event.pan, zoom: event.zoom } : {}),
    panView: assign(({ context, event }) => event.type === "view.panned" ? { pan: { x: context.pan.x + event.delta.x, y: context.pan.y + event.delta.y } } : {}),
    moveNode: assign(({ context, event }) => {
      if (event.type !== "node.moved") return {}
      const node = context.graph.nodes[event.id]
      return node ? { graph: { ...context.graph, nodes: { ...context.graph.nodes, [event.id]: { ...node, x: node.x + event.delta.x / context.zoom, y: node.y + event.delta.y / context.zoom } } } } : {}
    }),
    resetView: assign({ pan: () => ({ x: 380, y: 130 }), zoom: () => .7 }),
    applyLayout: assign(({ event }) => ({ graph: (event as unknown as { output: GraphState }).output })),
    recordLayoutError: assign(({ event }) => { const error = (event as { error?: unknown }).error; return { error: error instanceof Error ? error.message : "Unable to lay out the graph." } }),
  },
}).createMachine({
  id: "visualizer",
  initial: "ready",
  context: initialContext,
  invoke: { src: "observeDisplayGraph", input: ({ context }) => ({ publisher: context.displayGraphPublisher }) },
  states: {
    ready: { on: {
      "graph.updated": { target: "layout", actions: "updateGraph" },
      "view.changed": { actions: "updateView" },
      "view.panned": { actions: "panView" },
      "node.moved": { actions: "moveNode" },
      "view.reset": { actions: "resetView" },
    } },
    layout: { invoke: { src: "layoutGraph", input: ({ context }) => context.graph, onDone: { target: "ready", actions: "applyLayout" }, onError: { target: "ready", actions: "recordLayoutError" } } },
  },
})
