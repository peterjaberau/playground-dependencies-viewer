import { assign, emit, fromPromise, setup } from "xstate"
import { createDisplayGraph } from "../lib/display-graph"
import type { DisplayGraphChangedEvent } from "../lib/display-graph-events"
import { EMPTY_GRAPH, type GraphNode, type GraphState } from "../lib/graph-types"
import { findRelated } from "../lib/graph-traversal"
import { loadGraph } from "../lib/load-graph"

export type DataContext = { completeGraph: GraphState; displayGraph: GraphState; components: string[]; filters: string[]; selected: string[]; selectionItems: Array<{ id: string; type: GraphNode["type"] }>; related: string[]; query: string; matches: GraphNode[]; error: string }
type DataEvent = { type: "filters.changed"; filters: string[] } | { type: "node.toggled"; id: string } | { type: "selection.cleared" } | { type: "query.changed"; query: string }
type LoadedGraph = { graph: GraphState; components: string[] }

const initialContext: DataContext = { completeGraph: EMPTY_GRAPH, displayGraph: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], selectionItems: [], related: [], query: "", matches: [], error: "" }

export const dataMachine = setup({
  types: {} as { context: DataContext; events: DataEvent; emitted: DisplayGraphChangedEvent },
  actors: { loadGraph: fromPromise(({ input }: { input: { filters: string[] } }) => loadGraph(input.filters)) },
  actions: {
    applyFilters: assign(({ event }) => event.type === "filters.changed" ? { filters: event.filters } : {}),
    hydrateLoadedGraph: assign(({ context, event }) => {
      const output = (event as unknown as { output: LoadedGraph }).output
      const completeGraph = output.graph
      const selected = context.selected.filter((id) => completeGraph.nodes[id])
      const selectionItems = selected.map((id) => completeGraph.nodes[id]).filter((node): node is GraphNode => Boolean(node)).sort((left, right) => Number(left.type !== "component") - Number(right.type !== "component")).map((node) => ({ id: node.id, type: node.type }))
      const related = [...new Set(selected.flatMap((id) => [...findRelated(completeGraph, id, "downstream")]))]
      const matches = context.query ? Object.values(completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8) : []
      return { completeGraph, components: output.components, selected, selectionItems, related, displayGraph: createDisplayGraph(completeGraph, selected), matches, error: "" }
    }),
    recordLoadError: assign(({ event }) => {
      const error = (event as { error?: unknown }).error
      return { error: error instanceof Error ? error.message : "Unable to load token data." }
    }),
    toggleNode: assign(({ context, event }) => {
      if (event.type !== "node.toggled") return {}
      const selected = context.selected.includes(event.id) ? context.selected.filter((id) => id !== event.id) : [...context.selected, event.id]
      const selectionItems = selected.map((id) => context.completeGraph.nodes[id]).filter((node): node is GraphNode => Boolean(node)).sort((left, right) => Number(left.type !== "component") - Number(right.type !== "component")).map((node) => ({ id: node.id, type: node.type }))
      const related = [...new Set(selected.flatMap((id) => [...findRelated(context.completeGraph, id, "downstream")]))]
      return { selected, selectionItems, related, displayGraph: createDisplayGraph(context.completeGraph, selected) }
    }),
    clearSelection: assign(({ context }) => ({ selected: [], selectionItems: [], related: [], displayGraph: createDisplayGraph(context.completeGraph, []) })),
    updateQuery: assign(({ context, event }) => event.type === "query.changed" ? { query: event.query, matches: event.query ? Object.values(context.completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(event.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(event.query.toLowerCase())).slice(0, 8) : [] } : {}),
    notifyDisplayGraphChanged: emit(({ context }) => ({ type: "displayGraph.changed", graph: context.displayGraph } as DisplayGraphChangedEvent)),
  },
}).createMachine({
  id: "data",
  initial: "loading",
  context: initialContext,
  states: {
    loading: {
      invoke: { src: "loadGraph", input: ({ context }) => ({ filters: context.filters }), onDone: { target: "ready", actions: ["hydrateLoadedGraph", "notifyDisplayGraphChanged"] }, onError: { target: "failure", actions: "recordLoadError" } },
      on: { "filters.changed": { actions: "applyFilters" } },
    },
    ready: {
      on: {
        "filters.changed": { target: "loading", actions: "applyFilters" },
        "node.toggled": { actions: ["toggleNode", "notifyDisplayGraphChanged"] },
        "selection.cleared": { actions: ["clearSelection", "notifyDisplayGraphChanged"] },
        "query.changed": { actions: "updateQuery" },
      },
    },
    failure: { on: { "filters.changed": { target: "loading", actions: "applyFilters" } } },
  },
})
