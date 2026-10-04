import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import { dataMachine } from "../machines/data-machine"
import { RootContext } from "../providers/root-provider"

export function useDataActor() {
  const dataActor = RootContext.useSelector((snapshot) => snapshot.context.data) as ActorRefFrom<typeof dataMachine>
  const selected = useSelector(dataActor, (dataState) => ({
    dataContext: dataState.context,
    completeNodeCount: Object.keys(dataState.context.completeGraph.nodes).length,
    selectionItems: dataState.context.selectionItems,
  }))

  return { dataActor, ...selected }
}
