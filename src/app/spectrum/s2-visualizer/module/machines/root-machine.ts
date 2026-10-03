import { assign, setup } from "xstate"
import { dataMachine } from "./data-machine"
import { graphEventsMachine } from "./graph-events-machine"
import { visualizerMachine } from "./visualizer-machine"
import { visualizerLayoutMachine } from "./visualizer-layout-machine"

export type RootMachineInput = { theme?: "light" | "dark" }

export const rootMachine = setup({
  types: {} as { context: { data: any; visualizer: any; visualizerLayout: any; graphEvents: any }; events: { type: "visualizer.ready" }; input: RootMachineInput },
  actors: { dataMachine, visualizerMachine, visualizerLayoutMachine, graphEventsMachine },
  actions: {
    spawnVisualizerLayout: assign(({ context, spawn }) => ({ visualizerLayout: spawn("visualizerLayoutMachine", { id: "visualizerLayout", input: { visualizer: context.visualizer, graphEvents: context.graphEvents } }) })),
  },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => {
    const graphEvents = spawn("graphEventsMachine", { id: "graphEvents" })
    const data = spawn("dataMachine", { id: "data", input: { graphEvents } })
    return { graphEvents, data, visualizer: spawn("visualizerMachine", { id: "visualizer", input: {} }), visualizerLayout: null }
  },
  initial: "starting",
  states: {
    starting: { on: { "visualizer.ready": { target: "ready", actions: "spawnVisualizerLayout" } } },
    ready: {},
  },
})
