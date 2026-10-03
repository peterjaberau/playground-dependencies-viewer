import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import { graphMachine } from "../machines/graph-machine"
import { RootContext } from "../providers/root-provider"

export function useGraphActor() {
  const graphActor = RootContext.useSelector((snapshot) => snapshot.context.graph) as ActorRefFrom<typeof graphMachine>
  const selected = useSelector(graphActor, (graphState) => ({ graphState, graphContext: graphState.context }))
  return { graphActor, ...selected }
}
