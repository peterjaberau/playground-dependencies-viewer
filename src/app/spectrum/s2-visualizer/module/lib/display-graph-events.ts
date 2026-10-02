import type { GraphState } from "./graph-types"

/** Public event contract for any actor interested in rendered graph changes. */
export type DisplayGraphChangedEvent = { type: "displayGraph.changed"; graph: GraphState; selected: string[]; related: string[] }

export type DisplayGraphEventPublisher = {
  getSnapshot(): { context: { displayGraph: GraphState; selected: string[]; related: string[] } }
  subscribe(listener: (snapshot: { context: { displayGraph: GraphState; selected: string[]; related: string[] } }) => void): { unsubscribe(): void }
  on(type: DisplayGraphChangedEvent["type"], handler: (event: DisplayGraphChangedEvent) => void): { unsubscribe(): void }
}
