import { assign, fromPromise, sendTo, setup } from "xstate"
import { createDisplayGraph } from "../lib/display-graph"
import type { DisplayGraphChangedEvent } from "../lib/display-graph-events"
import { EMPTY_GRAPH, type GraphNode, type GraphState } from "../lib/graph-types"
import { findRelated } from "../lib/graph-traversal"
import { loadGraph } from "../lib/load-graph"

export type DataContext = { completeGraph: GraphState; displayGraph: GraphState; components: string[]; filters: string[]; selected: string[]; selectionItems: Array<{ id: string; type: GraphNode["type"] }>; related: string[]; focusNodeIds: string[]; query: string; matches: GraphNode[]; error: string; graphEvents: any }
type DataEvent = { type: "filters.changed"; filters: string[] } | { type: "node.toggled"; id: string } | { type: "selection.cleared" } | { type: "query.changed"; query: string }
type LoadedGraph = { graph: GraphState; components: string[] }

const initialContext = ({ input }: { input: { graphEvents: any } }): DataContext => ({ completeGraph: EMPTY_GRAPH, displayGraph: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], selectionItems: [], related: [], focusNodeIds: [], query: "", matches: [], error: "", graphEvents: input.graphEvents })

export const dataMachine = setup({
  types: {} as { context: DataContext; input: { graphEvents: any }; events: DataEvent },
  actors: { loadGraph: fromPromise(({ input }: { input: { filters: string[] } }) => loadGraph(input.filters)) },
  actions: {
    applyFilters: assign(({ event }) => event.type === "filters.changed" ? { filters: event.filters } : {}),
    hydrateLoadedGraph: assign(({ context, event }) => {
      const output = (event as unknown as { output: LoadedGraph }).output
      const completeGraph = output.graph
      const selected = context.selected.filter((id) => completeGraph.nodes[id])
      const selectionItems = selected.map((id) => completeGraph.nodes[id]).filter((node): node is GraphNode => Boolean(node)).sort((left, right) => Number(left.type !== "component") - Number(right.type !== "component")).map((node) => ({ id: node.id, type: node.type }))
      const related = [...new Set(selected.flatMap((id) => [...findRelated(completeGraph, id, "downstream")]))]
      const selectedTokens = selected.filter((id) => completeGraph.nodes[id]?.type !== "component")
      const downstream = new Set(selected.flatMap((id) => [...findRelated(completeGraph, id, "downstream")]))
      selected.forEach((id) => downstream.delete(id))
      const focusNodeIds = downstream.size
        ? [...new Set([...selected, ...downstream])]
        : [...new Set([...selected, ...selectedTokens.flatMap((id) => [...findRelated(completeGraph, id, "upstream")])])]
      const matches = context.query ? Object.values(completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8) : []
      return { completeGraph, components: output.components, selected, selectionItems, related, focusNodeIds, displayGraph: createDisplayGraph(completeGraph, selected), matches, error: "" }
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
      const selectedTokens = selected.filter((id) => context.completeGraph.nodes[id]?.type !== "component")
      const downstream = new Set(selected.flatMap((id) => [...findRelated(context.completeGraph, id, "downstream")]))
      selected.forEach((id) => downstream.delete(id))
      const focusNodeIds = downstream.size
        ? [...new Set([...selected, ...downstream])]
        : [...new Set([...selected, ...selectedTokens.flatMap((id) => [...findRelated(context.completeGraph, id, "upstream")])])]
      return { selected, selectionItems, related, focusNodeIds, displayGraph: createDisplayGraph(context.completeGraph, selected) }
    }),
    clearSelection: assign(({ context }) => ({ selected: [], selectionItems: [], related: [], focusNodeIds: [], displayGraph: createDisplayGraph(context.completeGraph, []) })),
    updateQuery: assign(({ context, event }) => event.type === "query.changed" ? { query: event.query, matches: event.query ? Object.values(context.completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(event.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(event.query.toLowerCase())).slice(0, 8) : [] } : {}),
    notifyDisplayGraphChanged: sendTo(({ context }) => context.graphEvents, ({ context }) => ({ type: "displayGraph.published", event: { type: "displayGraph.changed", graph: context.displayGraph, selected: context.selected, related: context.related, focusNodeIds: context.focusNodeIds } as DisplayGraphChangedEvent })),
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
