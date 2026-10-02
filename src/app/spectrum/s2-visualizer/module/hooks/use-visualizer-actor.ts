import { useSelector } from "@xstate/react"
import type { ActorRefFrom } from "xstate"
import { visualizerMachine } from "../machines/visualizer-machine"
import { RootContext } from "../providers/root-provider"

export function useVisualizerActor() {
  const visualizerActor = RootContext.useSelector((snapshot) => snapshot.context.visualizer) as ActorRefFrom<typeof visualizerMachine>
  const selected = useSelector(visualizerActor, (visualizerState) => ({
    visualizerState,
    visualizerContext: visualizerState.context,
    graph: visualizerState.context.graph ,
  }))


  return { visualizerActor, ...selected  }
}
