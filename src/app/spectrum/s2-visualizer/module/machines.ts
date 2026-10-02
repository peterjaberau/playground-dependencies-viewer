import { assign, fromPromise, setup } from "xstate"
import { EMPTY_GRAPH, createDisplayGraph, findRelated, loadGraph, type GraphNode, type GraphState } from "./graph"

export type DataContext = {
  completeGraph: GraphState
  displayGraph: GraphState
  components: string[]
  filters: string[]
  selected: string[]
  related: string[]
  query: string
  matches: GraphNode[]
  error: string
}

export type VisualizerContext = {
  graph: GraphState
  pan: { x: number; y: number }
  zoom: number
  error: string
}

const initialData: DataContext = { completeGraph: EMPTY_GRAPH, displayGraph: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], related: [], query: "", matches: [], error: "" }
const initialVisualizer: VisualizerContext = { graph: EMPTY_GRAPH, pan: { x: 380, y: 130 }, zoom: .7, error: "" }

const layoutGraph = fromPromise(async ({ input }: { input: GraphState }) => {
  const worker = new Worker(new URL("./workers/graph-layout.ts", import.meta.url))
  return new Promise<GraphState>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<GraphState>) => { worker.terminate(); resolve(event.data) }
    worker.onerror = () => { worker.terminate(); reject(new Error("The graph layout worker could not start.")) }
    worker.postMessage(input)
  })
})

const toggle = (selected: string[], id: string) => selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
const search = (graph: GraphState, query: string) => query ? Object.values(graph.nodes).filter((node) => node.id.toLowerCase().includes(query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(query.toLowerCase())).slice(0, 8) : []
const related = (graph: GraphState, selected: string[]) => [...new Set(selected.flatMap((id) => [...findRelated(graph, id, "downstream")]))]

export const dataMachine = setup({
  types: {} as { context: DataContext; events: { type: "filters.changed"; filters: string[] } | { type: "node.toggled"; id: string } | { type: "selection.cleared" } | { type: "query.changed"; query: string } },
  actors: { loadGraph: fromPromise(({ input }: { input: { filters: string[] } }) => loadGraph(input.filters)) },
}).createMachine({
  id: "data",
  initial: "loading",
  context: initialData,
  states: {
    loading: {
      invoke: {
        src: "loadGraph", input: ({ context }) => ({ filters: context.filters }),
        onDone: { target: "ready", actions: assign(({ context, event }) => { const selected = context.selected.filter((id) => event.output.graph.nodes[id]); return { completeGraph: event.output.graph, components: event.output.components, selected, related: related(event.output.graph, selected), displayGraph: createDisplayGraph(event.output.graph, selected), matches: search(event.output.graph, context.query), error: "" } }) },
        onError: { target: "failure", actions: assign({ error: ({ event }) => event.error instanceof Error ? event.error.message : "Unable to load token data." }) },
      },
      on: { "filters.changed": { actions: assign({ filters: ({ event }) => event.filters }) } },
    },
    ready: {
      on: {
        "filters.changed": { target: "loading", actions: assign({ filters: ({ event }) => event.filters }) },
        "node.toggled": { actions: assign(({ context, event }) => { const selected = toggle(context.selected, event.id); return { selected, related: related(context.completeGraph, selected), displayGraph: createDisplayGraph(context.completeGraph, selected) } }) },
        "selection.cleared": { actions: assign(({ context }) => ({ selected: [], related: [], displayGraph: createDisplayGraph(context.completeGraph, []) })) },
        "query.changed": { actions: assign(({ context, event }) => ({ query: event.query, matches: search(context.completeGraph, event.query) })) },
      },
    },
    failure: { on: { "filters.changed": { target: "loading", actions: assign({ filters: ({ event }) => event.filters }) } } },
  },
})

export const visualizerMachine = setup({
  types: {} as { context: VisualizerContext; events: { type: "graph.updated"; graph: GraphState } | { type: "view.changed"; pan: { x: number; y: number }; zoom: number } | { type: "view.panned"; delta: { x: number; y: number } } | { type: "node.moved"; id: string; delta: { x: number; y: number } } | { type: "view.reset" } },
  actors: { layoutGraph },
}).createMachine({
  id: "visualizer",
  initial: "ready",
  context: initialVisualizer,
  states: {
    ready: { on: {
      "graph.updated": { target: "layout", actions: assign({ graph: ({ event }) => event.graph }) },
      "view.changed": { actions: assign({ pan: ({ event }) => event.pan, zoom: ({ event }) => event.zoom }) },
      "view.panned": { actions: assign({ pan: ({ context, event }) => ({ x: context.pan.x + event.delta.x, y: context.pan.y + event.delta.y }) }) },
      "node.moved": { actions: assign(({ context, event }) => { const node = context.graph.nodes[event.id]; return node ? { graph: { ...context.graph, nodes: { ...context.graph.nodes, [event.id]: { ...node, x: node.x + event.delta.x / context.zoom, y: node.y + event.delta.y / context.zoom } } } } : {} }) },
      "view.reset": { actions: assign({ pan: () => ({ x: 380, y: 130 }), zoom: () => .7 }) },
    } },
    layout: { invoke: { src: "layoutGraph", input: ({ context }) => context.graph, onDone: { target: "ready", actions: assign({ graph: ({ event }) => event.output }) }, onError: { target: "ready", actions: assign({ error: ({ event }) => event.error instanceof Error ? event.error.message : "Unable to lay out the graph." }) } } },
  },
})

// The root supervisor owns the two child actors. Keeping their references in
// context makes the data/visual boundary explicit for every future consumer.
export const s2Machine = setup({
  types: {} as { context: { data: any; visualizer: any } },
  actors: { dataMachine, visualizerMachine },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => ({
    data: spawn("dataMachine", { id: "data" }),
    visualizer: spawn("visualizerMachine", { id: "visualizer" }),
  }),
})
