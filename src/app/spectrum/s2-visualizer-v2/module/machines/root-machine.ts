import { setup } from "xstate"
import { dataMachine } from "./data-machine"
import { visualizerMachine } from "./visualizer-machine"

export type RootMachineInput = { theme?: "light" | "dark" }

export const rootMachine = setup({
  types: {} as { context: { data: any; visualizer: any }; input: RootMachineInput },
  actors: { dataMachine, visualizerMachine },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => {
    const data = spawn("dataMachine", { id: "data" })
    return { data, visualizer: spawn("visualizerMachine", { id: "visualizer", input: { displayGraphPublisher: data } }) }
  },
})
