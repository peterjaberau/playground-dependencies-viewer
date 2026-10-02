import { fromPromise } from "xstate"
import type { GraphState } from "./graph-types"

/** Delegates the expensive layout work to the existing dedicated worker. */
export const layoutGraphActor = fromPromise(async ({ input }: { input: GraphState }) => {
  const worker = new Worker(new URL("../workers/graph-layout.ts", import.meta.url))
  return new Promise<GraphState>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<GraphState>) => { worker.terminate(); resolve(event.data) }
    worker.onerror = () => { worker.terminate(); reject(new Error("The graph layout worker could not start.")) }
    worker.postMessage(input)
  })
})
