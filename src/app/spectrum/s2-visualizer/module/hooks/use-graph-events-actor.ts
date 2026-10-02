import { useSelector } from "@xstate/react"
import { RootContext } from "../providers/root-provider"

export function useGraphEventsActor() {
  const graphEventsActor = RootContext.useSelector((snapshot) => snapshot.context.graphEvents) as any
  const graphEventsContext = useSelector(graphEventsActor, (graphEventsState: any) => graphEventsState.context)
  return { graphEventsActor, graphEventsContext }
}
