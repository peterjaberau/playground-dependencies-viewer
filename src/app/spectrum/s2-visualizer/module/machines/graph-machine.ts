import type { Viewport } from "@xyflow/react"
import type { ActorRefFrom } from "xstate"
import { assign, setup } from "xstate"
import { calculateGraphLayout } from "../lib/calculate-graph-layout"
import { createDisplayGraph } from "../lib/display-graph"
import { createFlowElements, type SpectrumFlowEdge, type SpectrumFlowNode } from "../lib/flow-elements"
import type { dataMachine } from "./data-machine"

export type GraphContext = {
  data: ActorRefFrom<typeof dataMachine>
  nodes: SpectrumFlowNode[]
  edges: SpectrumFlowEdge[]
  viewport: Viewport
  focusRequest: number
  error: string
}
export type GraphInput = { data: ActorRefFrom<typeof dataMachine> }
type GraphEvent =
  | { type: "data.selection.changed" }
  | { type: "viewport.changed"; viewport: Viewport }
  | { type: "node.moved"; id: string; position: { x: number; y: number } }
  | { type: "view.reset" }

const initialContext = ({ input }: { input: GraphInput }): GraphContext => ({
  data: input.data,
  nodes: [],
  edges: [],
  viewport: { x: 380, y: 130, zoom: 0.7 },
  focusRequest: 0,
  error: "",
})

export const graphMachine = setup({
  types: {} as { context: GraphContext; input: GraphInput; events: GraphEvent },
  actions: {
    refreshGraphFlow: assign(({ context }) => {
      const data = context.data.getSnapshot().context
      const graph = calculateGraphLayout(createDisplayGraph(data.graphAll, data.selected))
      return {
        ...createFlowElements(
          graph,
          data.selected,
          data.selectionAncestorNodeIds,
          data.selectionDescendentNodeIds,
          data.selectedChildDescendentNodeIds,
          data.selectionDescendentIntersectNodeIds,
        ),
        focusRequest: data.focusNodeIds.length ? context.focusRequest + 1 : context.focusRequest,
        error: "",
      }
    }),
    updateViewport: assign(({ event }) => (event.type === "viewport.changed" ? { viewport: event.viewport } : {})),
    persistNodePosition: assign(({ context, event }) => {
      if (event.type !== "node.moved") return {}
      return {
        nodes: context.nodes.map((node) => (node.id === event.id ? { ...node, position: event.position } : node)),
      }
    }),
    resetViewport: assign({ viewport: () => ({ x: 380, y: 130, zoom: 0.7 }) }),
  },
}).createMachine({
  id: "graph",
  initial: "ready",
  context: initialContext,
  states: {
    ready: {
      entry: "refreshGraphFlow",
      on: {
        "data.selection.changed": { actions: "refreshGraphFlow" },
        "viewport.changed": { actions: "updateViewport" },
        "node.moved": { actions: "persistNodePosition" },
        "view.reset": { actions: "resetViewport" },
      },
    },
  },
})
