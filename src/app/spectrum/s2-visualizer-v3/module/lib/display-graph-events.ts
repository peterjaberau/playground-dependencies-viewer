import type { GraphState } from "./graph-types"

/** Public event contract for any actor interested in rendered graph changes. */
export type GraphDataChangedEvent = { type: "graphData.changed"; graph: GraphState; selected: string[]; related: string[]; focusNodeIds: string[] }

export type GraphDataEventPublisher = {
  getSnapshot(): { context: { graphData: GraphState; selected: string[]; related: string[]; focusNodeIds: string[] } }
  subscribe(listener: (snapshot: { context: { graphData: GraphState; selected: string[]; related: string[]; focusNodeIds: string[] } }) => void): { unsubscribe(): void }
  on(type: GraphDataChangedEvent["type"], handler: (event: GraphDataChangedEvent) => void): { unsubscribe(): void }
}
