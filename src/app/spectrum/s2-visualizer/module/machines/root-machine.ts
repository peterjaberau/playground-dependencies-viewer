import { setup } from "xstate"
import { dataMachine } from "./data-machine"
import { graphEventsMachine } from "./graph-events-machine"
import { visualizerMachine } from "./visualizer-machine"

export type RootMachineInput = { theme?: "light" | "dark" }

export const rootMachine = setup({
  types: {} as { context: { data: any; visualizer: any; graphEvents: any }; input: RootMachineInput },
  actors: { dataMachine, visualizerMachine, graphEventsMachine },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => {
    const graphEvents = spawn("graphEventsMachine", { id: "graphEvents" })
    const data = spawn("dataMachine", { id: "data", input: { graphEvents } })
    return { graphEvents, data, visualizer: spawn("visualizerMachine", { id: "visualizer", input: { graphEvents } }) }
  },
})
