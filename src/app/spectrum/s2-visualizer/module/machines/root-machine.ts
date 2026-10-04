import { sendTo, setup } from "xstate"
import { dataMachine } from "./data-machine"
import { graphMachine } from "./graph-machine"

export type RootMachineInput = { theme?: "light" | "dark" }

export const rootMachine = setup({
  types: {} as { context: { data: any; graph: any }; input: RootMachineInput; events: { type: "data.selection.changed" } },
  actors: { dataMachine, graphMachine },
}).createMachine({
  id: "s2",
  context: ({ spawn }) => {
    const data = spawn("dataMachine", { id: "data", input: {} })
    return { data, graph: spawn("graphMachine", { id: "graph", input: { data } }) }
  },
  on: {
    "data.selection.changed": { actions: sendTo(({ context }) => context.graph, { type: "data.selection.changed" }) },
  },
})
