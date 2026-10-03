import { setup } from "xstate"
import { dataMachine } from "./data-machine"
import { graphMachine } from "./graph-machine"

export type RootMachineInput = { theme?: "light" | "dark" }

export const rootMachine = setup({
  types: {} as { context: { data: any; graph: any }; input: RootMachineInput },
  actors: { dataMachine, graphMachine },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => {
    const graph = spawn("graphMachine", { id: "graph", input: {} })
    return { graph, data: spawn("dataMachine", { id: "data", input: { graph } }) }
  },
})
