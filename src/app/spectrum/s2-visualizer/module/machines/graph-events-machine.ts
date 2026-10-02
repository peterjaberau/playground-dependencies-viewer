import { enqueueActions, setup } from "xstate"
import type { DisplayGraphChangedEvent } from "../lib/display-graph-events"

type GraphEventsContext = { latest?: DisplayGraphChangedEvent; subscribers: any[] }
type GraphEventsEvent = { type: "displayGraph.published"; event: DisplayGraphChangedEvent } | { type: "displayGraph.subscribed"; subscriber: any }

export const graphEventsMachine = setup({
  types: {} as { context: GraphEventsContext; events: GraphEventsEvent },
  actions: {
    publish: enqueueActions(({ context, event, enqueue }) => {
      if (event.type !== "displayGraph.published") return
      enqueue.assign({ latest: event.event })
      for (const subscriber of context.subscribers) enqueue.sendTo(subscriber, { type: "graph.updated", graph: event.event.graph, selected: event.event.selected, related: event.event.related } as any)
    }),
    subscribe: enqueueActions(({ context, event, enqueue }) => {
      if (event.type !== "displayGraph.subscribed") return
      enqueue.assign({ subscribers: [...context.subscribers, event.subscriber] })
      if (context.latest) enqueue.sendTo(event.subscriber, { type: "graph.updated", graph: context.latest.graph, selected: context.latest.selected, related: context.latest.related } as any)
    }),
  },
}).createMachine({
  id: "graphEvents",
  context: { subscribers: [] },
  on: {
    "displayGraph.published": { actions: "publish" },
    "displayGraph.subscribed": { actions: "subscribe" },
  },
})
