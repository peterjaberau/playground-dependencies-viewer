import { assign, sendParent, setup } from "xstate"
import { EMPTY_GRAPH, type GraphNode, type GraphState } from "../lib/graph-types"
import { createIncomingAdjacency, findDownstreamIntersection, findRelated } from "../lib/graph-traversal"
import { components, orphanes, relations, tokens } from "../store"

export type GraphRelation = { from: string; to: string; value?: string }
export type DataContext = { components: string[]; orphanes: string[]; tokens: string[]; relations: GraphRelation[]; graphAll: GraphState; selected: string[]; selectionItems: Array<{ id: string; type: GraphNode["type"] }>; selectionAncestorNodeIds: string[]; selectionDescendentNodeIds: string[]; selectedChildDescendentNodeIds: string[]; selectionDescendentIntersectNodeIds: string[]; focusNodeIds: string[]; query: string; matches: GraphNode[] }
type DataEvent = { type: "selection.changed"; id: string } | { type: "selection.cleared" } | { type: "query.changed"; query: string }

const initialContext = (): DataContext => ({
  components: [...components],
  orphanes: [...orphanes],
  tokens: [...tokens],
  relations: relations.map(({ from, to, value }) => ({ from, to, ...(value !== undefined ? { value } : {}) })),
  graphAll: EMPTY_GRAPH,
  selected: [],
  selectionItems: [],
  selectionAncestorNodeIds: [],
  selectionDescendentNodeIds: [],
  selectedChildDescendentNodeIds: [],
  selectionDescendentIntersectNodeIds: [],
  focusNodeIds: [],
  query: "",
  matches: [],
})

export const dataMachine = setup({
  types: {} as { context: DataContext; events: DataEvent },
  actions: {
    buildGraphAll: assign(({ context }) => {
      const graph: GraphState = { width: 0, height: 0, nodes: {}, adjacencyList: {} }
      const addNodes = (ids: string[], type: GraphNode["type"]) => {
        for (const id of ids) graph.nodes[id] = { id, type, x: 0, y: 0 }
      }
      addNodes(context.components, "component")
      addNodes(context.orphanes, "orphan-category")
      addNodes(context.tokens, "token")

      for (const { from, to, value } of context.relations) {
        graph.nodes[from] ??= { id: from, type: "token", x: 0, y: 0 }
        graph.nodes[to] ??= { id: to, type: "token", x: 0, y: 0 }
        const targets = graph.adjacencyList[from] ?? (graph.adjacencyList[from] = [])
        if (!targets.includes(to)) targets.push(to)
        if (value !== undefined) graph.nodes[to]!.value = value
      }

      return { graphAll: graph }
    }),
    captureSelectionChange: assign(({ context, event }) => event.type === "selection.changed" ? { selected: context.selected.includes(event.id) ? context.selected.filter((id) => id !== event.id) : [...context.selected, event.id] } : {}),
    clearSelectionCriteria: assign({ selected: () => [] }),
    captureSearchQuery: assign(({ event }) => event.type === "query.changed" ? { query: event.query } : {}),
    deriveSelectionData: assign(({ context }) => {
      const selectionItems = context.selected.map((id) => context.graphAll.nodes[id]).filter((node): node is GraphNode => Boolean(node)).sort((left, right) => Number(left.type !== "component") - Number(right.type !== "component")).map((node) => ({ id: node.id, type: node.type }))
      const selectedTokens = context.selected.filter((id) => context.graphAll.nodes[id]?.type !== "component")
      const selectedChildTokens = context.selected.filter((id) => context.graphAll.nodes[id]?.type === "token")
      const incoming = createIncomingAdjacency(context.graphAll)
      const selectionAncestorNodeIds = [...new Set(selectedTokens.flatMap((id) => [...findRelated(context.graphAll, id, "upstream", incoming)]))]
      const selectionDescendentNodeIds = [...new Set(context.selected.flatMap((id) => [...findRelated(context.graphAll, id, "downstream")]))]
      const selectedChildDescendentNodeIds = [...new Set(selectedChildTokens.flatMap((id) => [...findRelated(context.graphAll, id, "downstream")]))]
      const selectionDescendentIntersectNodeIds = findDownstreamIntersection(context.graphAll, context.selected)
      const focusNodeIds = [...new Set([...context.selected, ...selectionAncestorNodeIds, ...selectionDescendentNodeIds])]
      return { selectionItems, selectionAncestorNodeIds, selectionDescendentNodeIds, selectedChildDescendentNodeIds, selectionDescendentIntersectNodeIds, focusNodeIds }
    }),
    deriveSearchMatches: assign(({ context }) => ({ matches: context.query ? Object.values(context.graphAll.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8) : [] })),
    notifyParentOfSelectionChange: sendParent({ type: "data.selection.changed" }),
  },
}).createMachine({
  id: "data",
  initial: "ready",
  context: initialContext,
  states: {
    ready: {
      entry: ["buildGraphAll", "deriveSelectionData", "deriveSearchMatches", "notifyParentOfSelectionChange"],
      on: {
        "selection.changed": { actions: ["captureSelectionChange", "deriveSelectionData", "notifyParentOfSelectionChange"] },
        "selection.cleared": { actions: ["clearSelectionCriteria", "deriveSelectionData", "notifyParentOfSelectionChange"] },
        "query.changed": { actions: ["captureSearchQuery", "deriveSearchMatches"] },
      },
    },
  },
})
