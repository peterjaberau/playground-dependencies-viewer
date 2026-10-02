"use client"

import { Box, Button, Checkbox, Flex, Heading, HStack, IconButton, Input, Spinner, Stack, Text } from "@chakra-ui/react"
import { assign, fromPromise, setup } from "xstate"
import { useMachine } from "@xstate/react"
import { useEffect, useMemo, useRef } from "react"
import { Maximize2, Minus, Plus, Search, X } from "lucide-react"
import { EMPTY_GRAPH, filterGraph, findRelated, loadGraph, type GraphNode, type GraphState, valuesFor } from "./graph"

type Context = {
  completeGraph: GraphState
  graph: GraphState
  components: string[]
  filters: string[]
  selected: string[]
  query: string
  pan: { x: number; y: number }
  zoom: number
  error?: string
}

const initialContext: Context = {
  completeGraph: EMPTY_GRAPH, graph: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], query: "", pan: { x: 340, y: 100 }, zoom: 0.7,
}

const layoutGraph = fromPromise(async ({ input }: { input: GraphState }) => {
  const worker = new Worker(new URL("./workers/graph-layout.ts", import.meta.url))
  return new Promise<GraphState>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<GraphState>) => { worker.terminate(); resolve(event.data) }
    worker.onerror = () => { worker.terminate(); reject(new Error("The graph layout worker could not start.")) }
    worker.postMessage(input)
  })
})

const visualizerMachine = setup({
  types: {} as { context: Context; events:
    | { type: "filters.changed"; filters: string[] }
    | { type: "node.selected"; id: string; additive: boolean }
    | { type: "search.changed"; query: string }
    | { type: "view.panned"; delta: { x: number; y: number } }
    | { type: "view.zoomed"; zoom: number; anchor?: { x: number; y: number } }
    | { type: "view.reset" }
    | { type: "node.moved"; id: string; delta: { x: number; y: number } }
  },
  actors: { loadGraph: fromPromise(({ input }: { input: { filters: string[] } }) => loadGraph(input.filters)), layoutGraph },
}).createMachine({
  id: "s2TokenVisualizer",
  initial: "loading",
  context: initialContext,
  states: {
    loading: {
      invoke: {
        src: "loadGraph", input: ({ context }) => ({ filters: context.filters }),
        onDone: { target: "layout", actions: assign(({ context, event }) => {
          const selected = context.selected.filter((id) => event.output.graph.nodes[id])
          return { completeGraph: event.output.graph, components: event.output.components, selected, graph: filterGraph(event.output.graph, selected), error: "" }
        }) },
        onError: { target: "failure", actions: assign({ error: ({ event }) => event.error instanceof Error ? event.error.message : "Unable to load token data." }) },
      },
      on: { "filters.changed": { actions: assign({ filters: ({ event }) => event.filters }) } },
    },
    layout: {
      invoke: {
        src: "layoutGraph", input: ({ context }) => context.graph,
        onDone: { target: "ready", actions: assign({ graph: ({ event }) => event.output }) },
        onError: { target: "failure", actions: assign({ error: ({ event }) => event.error instanceof Error ? event.error.message : "Unable to lay out the graph." }) },
      },
    },
    ready: {
      on: {
        "filters.changed": { target: "loading", actions: assign({ filters: ({ event }) => event.filters }) },
        "search.changed": { actions: assign({ query: ({ event }) => event.query }) },
        "node.selected": { target: "layout", actions: assign(({ context, event }) => {
          const selected = event.additive ? (context.selected.includes(event.id) ? context.selected.filter((id) => id !== event.id) : [...context.selected, event.id]) : context.selected[0] === event.id ? [] : [event.id]
          return { selected, graph: filterGraph(context.completeGraph, selected) }
        }) },
        "view.panned": { actions: assign({ pan: ({ context, event }) => ({ x: context.pan.x + event.delta.x, y: context.pan.y + event.delta.y }) }) },
        "view.zoomed": { actions: assign(({ context, event }) => ({ zoom: Math.max(0.15, Math.min(2, event.zoom)), pan: event.anchor ? { x: event.anchor.x + (context.pan.x - event.anchor.x) * event.zoom / context.zoom, y: event.anchor.y + (context.pan.y - event.anchor.y) * event.zoom / context.zoom } : context.pan })) },
        "view.reset": { actions: assign({ selected: () => [], query: () => "", pan: () => ({ x: 340, y: 100 }), zoom: () => 0.7, graph: ({ context }) => filterGraph(context.completeGraph, []) }) },
        "node.moved": { actions: assign(({ context, event }) => {
          const node = context.graph.nodes[event.id]
          if (!node) return {}
          return { graph: { ...context.graph, nodes: { ...context.graph.nodes, [event.id]: { ...node, x: node.x + event.delta.x / context.zoom, y: node.y + event.delta.y / context.zoom } } } }
        }) },
      },
    },
    failure: { on: { "filters.changed": { target: "loading", actions: assign({ filters: ({ event }) => event.filters }) } } },
  },
})

export function S2Visualizer() {
  const [state, send] = useMachine(visualizerMachine)
  const context = state.context
  const surfaceRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ kind: "pan" | "node"; x: number; y: number; id?: string } | null>(null)
  const matches = useMemo(() => Object.values(context.completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8), [context.completeGraph.nodes, context.query])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") { event.preventDefault(); document.getElementById("s2-token-search")?.focus() }
      if (event.key === "Escape") send({ type: "view.reset" })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [send])

  const isBusy = state.matches("loading") || state.matches("layout")
  return <Flex height="100dvh" bg="gray.950" color="gray.100" overflow="hidden" fontFamily="mono">
    <Box width="280px" flexShrink={0} bg="gray.900" borderRightWidth="1px" borderColor="gray.700" p="4" zIndex="2" overflowY="auto">
      <Heading size="md" mb="1">Spectrum tokens</Heading>
      <Text fontSize="xs" color="gray.400" mb="4">Dependency explorer</Text>
      <Box position="relative" mb="5"><Search size={16} style={{ position: "absolute", left: 10, top: 10, opacity: .65 }} /><Input id="s2-token-search" pl="9" size="sm" placeholder="Search tokens" value={context.query} onChange={(event) => send({ type: "search.changed", query: event.target.value })} />
        {context.query && <Box position="absolute" top="10" left="0" right="0" bg="gray.800" borderWidth="1px" borderColor="gray.700" borderRadius="md" overflow="hidden" zIndex="5">{matches.map((node) => <Button key={node.id} variant="ghost" justifyContent="flex-start" width="100%" size="sm" borderRadius="0" onClick={() => send({ type: "node.selected", id: node.id, additive: false })}><Text truncate>{node.id}</Text></Button>)}</Box>}
      </Box>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.400">TOKEN SETS</Text>
      <Stack gap="2" mb="6">{["spectrum", "light", "dark", "desktop", "mobile"].map((filter) => <Checkbox.Root key={filter} checked={context.filters.includes(filter)} onCheckedChange={(details) => send({ type: "filters.changed", filters: details.checked ? [...context.filters, filter] : context.filters.filter((item) => item !== filter) })}><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label textTransform="capitalize">{filter}</Checkbox.Label></Checkbox.Root>)}</Stack>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.400">SELECTED</Text>
      <Stack gap="1">{context.selected.length ? context.selected.map((id) => <HStack key={id} justify="space-between"><Text fontSize="xs" truncate>{id}</Text><IconButton aria-label={`Remove ${id}`} size="2xs" variant="ghost" onClick={() => send({ type: "node.selected", id, additive: true })}><X size={13} /></IconButton></HStack>) : <Text fontSize="xs" color="gray.500">Click a node to inspect its dependencies.</Text>}</Stack>
    </Box>
    <Box ref={surfaceRef} flex="1" position="relative" overflow="hidden" bg="gray.950" cursor={drag.current ? "grabbing" : "grab"} onWheel={(event) => { event.preventDefault(); const rect = surfaceRef.current!.getBoundingClientRect(); if (event.ctrlKey || event.metaKey || event.shiftKey) send({ type: "view.zoomed", zoom: context.zoom * (event.deltaY > 0 ? .9 : 1.1), anchor: { x: event.clientX - rect.left, y: event.clientY - rect.top } }); else send({ type: "view.panned", delta: { x: -event.deltaX, y: -event.deltaY } }) }} onPointerDown={(event) => { if (event.target === event.currentTarget) { drag.current = { kind: "pan", x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) } }} onPointerMove={(event) => { const active = drag.current; if (!active) return; const delta = { x: event.clientX - active.x, y: event.clientY - active.y }; active.x = event.clientX; active.y = event.clientY; if (active.kind === "pan") send({ type: "view.panned", delta }); else if (active.id) send({ type: "node.moved", id: active.id, delta }) }} onPointerUp={() => { drag.current = null }}>
      <Box position="absolute" inset="0" zIndex="0" opacity=".3" bgImage="linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)" bgSize={`${Math.max(20, 100 * context.zoom)}px ${Math.max(20, 100 * context.zoom)}px`} style={{ backgroundPosition: `${context.pan.x}px ${context.pan.y}px` }} pointerEvents="none" />
      <Box position="absolute" zIndex="1" transform={`translate(${context.pan.x}px, ${context.pan.y}px) scale(${context.zoom})`} transformOrigin="0 0" transition={drag.current ? "none" : "transform .15s"}>{Object.entries(context.graph.adjacencyList).flatMap(([from, targets]) => targets.map((to) => {
        const fromNode = context.graph.nodes[from], toNode = context.graph.nodes[to]
        return fromNode && toNode ? <Edge key={`${from}-${to}`} from={fromNode} to={toNode} selected={context.selected} /> : null
      }))}{Object.values(context.graph.nodes).map((node) => <Node key={node.id} node={node} selected={context.selected.includes(node.id)} related={context.selected.some((id) => findRelated(context.completeGraph, id, "downstream").has(node.id))} onPointerDown={(event) => { event.stopPropagation(); drag.current = { kind: "node", id: node.id, x: event.clientX, y: event.clientY }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) }} onClick={(event) => { if (!drag.current) send({ type: "node.selected", id: node.id, additive: event.metaKey || event.ctrlKey || event.shiftKey }) }} />)}</Box>
      {isBusy && <Flex position="absolute" inset="0" align="center" justify="center" bg="blackAlpha.600"><Stack align="center"><Spinner /><Text>Loading and laying out token graph…</Text></Stack></Flex>}
      {state.matches("failure") && <Box position="absolute" top="4" left="4" bg="red.950" p="4" borderRadius="md"><Text>{context.error}</Text></Box>}
      <HStack position="absolute" right="4" bottom="4" bg="gray.900" borderWidth="1px" borderColor="gray.700" borderRadius="md" p="1"><IconButton aria-label="Zoom out" size="sm" onClick={() => send({ type: "view.zoomed", zoom: context.zoom * .8 })}><Minus size={16} /></IconButton><Text fontSize="xs" width="45px" textAlign="center">{Math.round(context.zoom * 100)}%</Text><IconButton aria-label="Zoom in" size="sm" onClick={() => send({ type: "view.zoomed", zoom: context.zoom * 1.2 })}><Plus size={16} /></IconButton><IconButton aria-label="Reset view" size="sm" onClick={() => send({ type: "view.reset" })}><Maximize2 size={15} /></IconButton></HStack>
    </Box>
  </Flex>
}

function Node({ node, selected, related, onPointerDown, onClick }: { node: GraphNode; selected: boolean; related: boolean; onPointerDown: React.PointerEventHandler; onClick: React.MouseEventHandler }) {
  const color = selected ? "yellow" : node.type === "component" ? "cyan" : node.type === "orphan-category" ? "blue" : related ? "purple" : "gray"
  return <Box position="absolute" left={`${node.x}px`} top={`${node.y}px`} width="450px" minHeight="36px" bg={`${color}.900`} borderWidth="1px" borderColor={selected ? "yellow.300" : `${color}.600`} borderRadius="sm" px="3" py="2" cursor="pointer" userSelect="none" onPointerDown={onPointerDown} onClick={onClick}><Text fontSize="xs" fontWeight="bold" color={`${color}.100`}>{node.id}</Text>{valuesFor(node).map((item, index) => <Flex key={`${item.value}-${index}`} gap="2" fontSize="10px" color={`${color}.200`}><Text fontWeight="bold">{item.path || "*"}</Text><Text truncate>{item.value}</Text></Flex>)}</Box>
}

function Edge({ from, to, selected }: { from: GraphNode; to: GraphNode; selected: string[] }) {
  const x1 = from.x + 450, y1 = from.y + 18, x2 = to.x, y2 = to.y + 18, width = Math.max(1, x2 - x1), top = Math.min(y1, y2)
  const highlighted = selected.includes(from.id) || selected.includes(to.id)
  return <svg aria-hidden="true" style={{ position: "absolute", left: x1, top, width, height: Math.abs(y2 - y1) + 1, overflow: "visible", pointerEvents: "none" }}><path d={`M 0 ${y1 - top} C ${width / 3} ${y1 - top}, ${width * 2 / 3} ${y2 - top}, ${width} ${y2 - top}`} stroke={highlighted ? "#d8b4fe" : "#475569"} strokeWidth="2" fill="none" /></svg>
}
