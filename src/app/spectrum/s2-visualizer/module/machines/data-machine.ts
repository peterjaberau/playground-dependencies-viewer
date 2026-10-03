import { assign, fromPromise, sendTo, setup } from "xstate"
import { createDisplayGraph } from "../lib/display-graph"
import type { GraphDataChangedEvent } from "../lib/display-graph-events"
import { fetchTokenData, type RawTokens } from "../lib/fetch-token-data"
import { EMPTY_GRAPH, type GraphNode, type GraphState } from "../lib/graph-types"
import { findRelated } from "../lib/graph-traversal"

const valuePathSplitter = ":^;"
const valuesListSplitter = ":*;"

export type DataContext = { rawTokenData: RawTokens; completeGraph: GraphState; graphData: GraphState; components: string[]; filters: string[]; selected: string[]; selectionItems: Array<{ id: string; type: GraphNode["type"] }>; related: string[]; focusNodeIds: string[]; query: string; matches: GraphNode[]; error: string; graph: any }
type DataEvent = { type: "filters.changed"; filters: string[] } | { type: "selection.changed"; id: string } | { type: "selection.cleared" } | { type: "query.changed"; query: string }

const initialContext = ({ input }: { input: { graph: any } }): DataContext => ({ rawTokenData: {}, completeGraph: EMPTY_GRAPH, graphData: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], selectionItems: [], related: [], focusNodeIds: [], query: "", matches: [], error: "", graph: input.graph })

export const dataMachine = setup({
  types: {} as { context: DataContext; input: { graph: any }; events: DataEvent },
  actors: { fetchingData: fromPromise(fetchTokenData) },
  actions: {
    captureFilterCriteria: assign(({ event }) => event.type === "filters.changed" ? { filters: event.filters } : {}),
    captureSelectionChange: assign(({ context, event }) => event.type === "selection.changed" ? { selected: context.selected.includes(event.id) ? context.selected.filter((id) => id !== event.id) : [...context.selected, event.id] } : {}),
    clearSelectionCriteria: assign({ selected: () => [] }),
    captureSearchQuery: assign(({ event }) => event.type === "query.changed" ? { query: event.query } : {}),
    storeFetchedData: assign(({ event }) => ({ rawTokenData: (event as unknown as { output: RawTokens }).output, error: "" })),
    buildGraphFromData: assign(({ context }) => {
      const graph: GraphState = { width: 0, height: 0, nodes: {}, adjacencyList: {} }
      const components: string[] = []
      const addNode = (node: GraphNode) => { graph.nodes[node.id] ??= node }
      const connect = (from: string, to: string, label?: string) => {
        const targets = graph.adjacencyList[from] ?? (graph.adjacencyList[from] = [])
        if (!targets.includes(to)) targets.push(to)
        if (label) (graph.nodes[from]!.adjacencyLabels ??= {})[to] = label
      }
      for (const [id, token] of Object.entries(context.rawTokenData)) {
        if (token.component) { addNode({ type: "component", id: token.component, x: 0, y: 0 }); if (!components.includes(token.component)) components.push(token.component); connect(token.component, id) }
        addNode({ type: "token", id, x: 0, y: 0 })
        const values: Array<{ value: string; path: string[] }> = []
        if (token.value) values.push({ value: token.value, path: [] })
        const pending = token.sets ? [{ sets: token.sets, path: [] as string[] }] : []
        while (pending.length) {
          const current = pending.pop()!
          for (const filter of context.filters) {
            const item = current.sets[filter]
            if (!item) continue
            const path = [...current.path, filter]
            if (item.value) values.push({ value: item.value, path })
            if (item.sets) pending.push({ sets: item.sets, path })
          }
        }
        const rawValues: string[] = []
        for (const found of values) {
          const value = String(found.value)
          if (value.startsWith("{") && value.endsWith("}")) {
            const target = value.slice(1, -1)
            const previous = graph.nodes[id]!.adjacencyLabels?.[target]?.split(",") ?? []
            connect(id, target, [...new Set([...previous, ...found.path])].join(","))
          } else rawValues.push(found.path.length ? `${value}${valuePathSplitter}${found.path.join(",")}` : value)
        }
        if (rawValues.length) graph.nodes[id]!.value = rawValues.join(valuesListSplitter)
      }
      const targets = new Set(Object.values(graph.adjacencyList).flat())
      const categories = new Set(Object.keys(graph.nodes).filter((id) => !targets.has(id) && graph.nodes[id]!.type === "token").map((id) => id.split("-")[0]!))
      for (const category of categories) {
        const categoryId = `${category}-*`
        addNode({ type: "orphan-category", id: categoryId, x: 0, y: 0 })
        for (const id of Object.keys(context.rawTokenData)) if (id.startsWith(`${category}-`)) connect(categoryId, id)
      }
      return { completeGraph: graph, components: components.sort() }
    }),
    reconcileSelectionData: assign(({ context }) => ({ selected: context.selected.filter((id) => context.completeGraph.nodes[id]) })),
    deriveSelectionData: assign(({ context }) => {
      const selectionItems = context.selected.map((id) => context.completeGraph.nodes[id]).filter((node): node is GraphNode => Boolean(node)).sort((left, right) => Number(left.type !== "component") - Number(right.type !== "component")).map((node) => ({ id: node.id, type: node.type }))
      const related = [...new Set(context.selected.flatMap((id) => [...findRelated(context.completeGraph, id, "downstream")]))]
      const selectedTokens = context.selected.filter((id) => context.completeGraph.nodes[id]?.type !== "component")
      const downstream = new Set(context.selected.flatMap((id) => [...findRelated(context.completeGraph, id, "downstream")]))
      context.selected.forEach((id) => downstream.delete(id))
      const focusNodeIds = downstream.size ? [...new Set([...context.selected, ...downstream])] : [...new Set([...context.selected, ...selectedTokens.flatMap((id) => [...findRelated(context.completeGraph, id, "upstream")])])]
      return { selectionItems, related, focusNodeIds, graphData: createDisplayGraph(context.completeGraph, context.selected) }
    }),
    deriveSearchMatches: assign(({ context }) => ({ matches: context.query ? Object.values(context.completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8) : [] })),
    recordDataFetchError: assign(({ event }) => {
      const error = (event as { error?: unknown }).error
      return { error: error instanceof Error ? error.message : "Unable to fetch token data." }
    }),
    notifySelectionChanged: sendTo(({ context }) => context.graph, ({ context }) => ({ type: "graphData.published", event: { type: "graphData.changed", graph: context.graphData, selected: context.selected, related: context.related, focusNodeIds: context.focusNodeIds } as GraphDataChangedEvent })),
    notifyFilteredDataChanged: sendTo(({ context }) => context.graph, ({ context }) => ({ type: "graphData.published", event: { type: "graphData.changed", graph: context.graphData, selected: context.selected, related: context.related, focusNodeIds: context.focusNodeIds } as GraphDataChangedEvent })),
  },
}).createMachine({
  id: "data",
  initial: "fetching",
  context: initialContext,
  states: {
    fetching: { invoke: { src: "fetchingData", onDone: { target: "ready", actions: ["storeFetchedData", "buildGraphFromData", "reconcileSelectionData", "deriveSelectionData", "deriveSearchMatches", "notifyFilteredDataChanged"] }, onError: { target: "failure", actions: "recordDataFetchError" } } },
    ready: { on: {
      "filters.changed": { actions: ["captureFilterCriteria", "buildGraphFromData", "reconcileSelectionData", "deriveSelectionData", "deriveSearchMatches", "notifyFilteredDataChanged"] },
      "selection.changed": { actions: ["captureSelectionChange", "deriveSelectionData", "notifySelectionChanged"] },
      "selection.cleared": { actions: ["clearSelectionCriteria", "deriveSelectionData", "notifySelectionChanged"] },
      "query.changed": { actions: ["captureSearchQuery", "deriveSearchMatches"] },
    } },
    failure: { on: { "filters.changed": { target: "fetching", actions: "captureFilterCriteria" } } },
  },
})
