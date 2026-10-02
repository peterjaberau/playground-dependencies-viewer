import type { GraphState } from "./graph-types"

/** Public event contract for any actor interested in rendered graph changes. */
export type DisplayGraphChangedEvent = { type: "displayGraph.changed"; graph: GraphState }

export type DisplayGraphEventPublisher = {
  getSnapshot(): { context: { displayGraph: GraphState } }
  on(type: DisplayGraphChangedEvent["type"], handler: (event: DisplayGraphChangedEvent) => void): { unsubscribe(): void }
}
