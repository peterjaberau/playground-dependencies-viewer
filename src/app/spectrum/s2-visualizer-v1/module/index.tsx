"use client"

import { Box, Button, Checkbox, Flex, Heading, HStack, IconButton, Input, Spinner, Stack, Text } from "@chakra-ui/react"
import { assign, fromPromise, setup } from "xstate"
import { useMachine } from "@xstate/react"
import { useEffect, useMemo, useRef } from "react"
import { Maximize2, Minus, Plus, Search, X } from "lucide-react"
import { EMPTY_GRAPH, createDisplayGraph, findRelated, loadGraph, type GraphNode, type GraphState, valuesFor } from "./graph"

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
  completeGraph: EMPTY_GRAPH, graph: EMPTY_GRAPH, components: [], filters: ["spectrum", "light", "desktop"], selected: [], query: "", pan: { x: 380, y: 130 }, zoom: 0.7,
}

const layoutGraph = fromPromise(async ({ input }: { input: GraphState }) => {
  const worker = new Worker(new URL("./workers/graph-layout.ts", import.meta.url))
  return new Promise<GraphState>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<GraphState>) => { worker.terminate(); resolve(event.data) }
    worker.onerror = () => { worker.terminate(); reject(new Error("The graph layout worker could not start.")) }
    worker.postMessage(input)
  })
})

// Mirrors AppController.toggleGraphNodeSelection from the Adobe implementation:
// clicking any already-selected item removes only that item; a modifier adds an
// item; an unmodified click replaces the whole selection.
function toggleSelection(current: string[], id: string, additive: boolean) {
  if (current.includes(id)) return current.filter((selected) => selected !== id)
  return additive ? [...current, id] : [id]
}

const visualizerMachine = setup({
  types: {} as { context: Context; events:
    | { type: "filters.changed"; filters: string[] }
    | { type: "node.selected"; id: string; additive: boolean }
    | { type: "selection.cleared" }
    | { type: "search.changed"; query: string }
    | { type: "view.panned"; delta: { x: number; y: number } }
    | { type: "view.changed"; pan: { x: number; y: number }; zoom: number }
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
          return { completeGraph: event.output.graph, components: event.output.components, selected, graph: createDisplayGraph(event.output.graph, selected), error: "" }
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
          const selected = toggleSelection(context.selected, event.id, event.additive)
          return { selected, graph: createDisplayGraph(context.completeGraph, selected) }
        }) },
        "selection.cleared": { target: "layout", actions: assign(({ context }) => ({ selected: [], graph: createDisplayGraph(context.completeGraph, []) })) },
        "view.panned": { actions: assign({ pan: ({ context, event }) => ({ x: context.pan.x + event.delta.x, y: context.pan.y + event.delta.y }) }) },
        "view.changed": { actions: assign({ pan: ({ event }) => event.pan, zoom: ({ event }) => event.zoom }) },
        "view.zoomed": { actions: assign(({ context, event }) => ({ zoom: Math.max(0.15, Math.min(2, event.zoom)), pan: event.anchor ? { x: event.anchor.x + (context.pan.x - event.anchor.x) * event.zoom / context.zoom, y: event.anchor.y + (context.pan.y - event.anchor.y) * event.zoom / context.zoom } : context.pan })) },
        "view.reset": { target: "layout", actions: assign({ selected: () => [], query: () => "", pan: () => ({ x: 380, y: 130 }), zoom: () => 0.7, graph: ({ context }) => createDisplayGraph(context.completeGraph, []) }) },
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
  const contentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const viewport = useRef({ pan: context.pan, zoom: context.zoom })
  const wheelFrame = useRef<number | null>(null)
  const drag = useRef<{ kind: "pan" | "node"; startX: number; startY: number; pan: { x: number; y: number }; id?: string; nodeElement?: HTMLElement; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const matches = useMemo(() => Object.values(context.completeGraph.nodes).filter((node) => node.id.toLowerCase().includes(context.query.toLowerCase()) || (node.value ?? "").toLowerCase().includes(context.query.toLowerCase())).slice(0, 8), [context.completeGraph.nodes, context.query])
  const relatedNodeIds = useMemo(() => new Set(context.selected.flatMap((id) => [...findRelated(context.completeGraph, id, "downstream")])), [context.completeGraph, context.selected])

  const paintViewport = (pan: { x: number; y: number }, zoom: number) => {
    if (contentRef.current) contentRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
    if (gridRef.current) {
      gridRef.current.style.backgroundPosition = `${pan.x}px ${pan.y}px`
      gridRef.current.style.backgroundSize = `${Math.max(20, 100 * zoom)}px ${Math.max(20, 100 * zoom)}px`
    }
  }

  useEffect(() => {
    viewport.current = { pan: context.pan, zoom: context.zoom }
  }, [context.pan, context.zoom])

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = surface.getBoundingClientRect()
      const prior = viewport.current
      let next = prior
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        const zoom = Math.max(.15, Math.min(2, prior.zoom * (event.deltaY > 0 ? .9 : 1.1)))
        const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        next = { zoom, pan: { x: anchor.x + (prior.pan.x - anchor.x) * zoom / prior.zoom, y: anchor.y + (prior.pan.y - anchor.y) * zoom / prior.zoom } }
      } else {
        next = { zoom: prior.zoom, pan: { x: prior.pan.x - event.deltaX * 2, y: prior.pan.y - event.deltaY * 2 } }
      }
      viewport.current = next
      paintViewport(next.pan, next.zoom)
      if (wheelFrame.current === null) wheelFrame.current = requestAnimationFrame(() => {
        wheelFrame.current = null
        send({ type: "view.changed", pan: viewport.current.pan, zoom: viewport.current.zoom })
      })
    }
    surface.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      surface.removeEventListener("wheel", handleWheel)
      if (wheelFrame.current !== null) cancelAnimationFrame(wheelFrame.current)
    }
  }, [send])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") { event.preventDefault(); document.getElementById("s2-token-search")?.focus() }
      if (event.key === "Escape") send({ type: "view.reset" })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [send])

  const isBusy = state.matches("loading") || (state.matches("layout") && Object.keys(context.graph.nodes).length === 0)
  const selectedItems = [
    ...context.selected.filter((id) => context.completeGraph.nodes[id]?.type === "component"),
    ...context.selected.filter((id) => context.completeGraph.nodes[id]?.type !== "component"),
  ]
  return <Flex height="100dvh" bg="gray.950" color="gray.100" overflow="hidden" fontFamily="mono">
    <Box width="250px" flexShrink={0} bg="gray.900" borderRightWidth="1px" borderColor="gray.700" p="4" zIndex="2" overflowY="auto">
      <Heading size="md" mb="1">Spectrum tokens</Heading>
      <Text fontSize="xs" color="gray.400" mb="4">Dependency explorer</Text>
      <Box position="relative" mb="5"><Search size={16} style={{ position: "absolute", left: 10, top: 10, opacity: .65 }} /><Input id="s2-token-search" pl="9" size="sm" placeholder="Search tokens" value={context.query} onChange={(event) => send({ type: "search.changed", query: event.target.value })} />
        {context.query && <Box position="absolute" top="10" left="0" right="0" bg="gray.800" borderWidth="1px" borderColor="gray.700" borderRadius="md" overflow="hidden" zIndex="5">{matches.map((node) => <Button key={node.id} variant="ghost" justifyContent="flex-start" width="100%" size="sm" borderRadius="0" onClick={() => send({ type: "node.selected", id: node.id, additive: true })}><Text truncate>{node.id}</Text></Button>)}</Box>}
      </Box>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.400">TOKEN SETS</Text>
      <Stack gap="2" mb="6">{["spectrum", "light", "dark", "desktop", "mobile"].map((filter) => <Checkbox.Root key={filter} checked={context.filters.includes(filter)} onCheckedChange={(details) => send({ type: "filters.changed", filters: details.checked ? [...context.filters, filter] : context.filters.filter((item) => item !== filter) })}><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label textTransform="capitalize">{filter}</Checkbox.Label></Checkbox.Root>)}</Stack>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.400">SELECTED</Text>
      <Stack gap="1">{context.selected.length ? context.selected.map((id) => <HStack key={id} justify="space-between"><Text fontSize="xs" truncate>{id}</Text><IconButton aria-label={`Remove ${id}`} size="2xs" variant="ghost" onClick={() => send({ type: "node.selected", id, additive: true })}><X size={13} /></IconButton></HStack>) : <Text fontSize="xs" color="gray.500">Click a node to inspect its dependencies.</Text>}</Stack>
    </Box>
    <Box ref={surfaceRef} flex="1" position="relative" overflow="hidden" bg="gray.950" cursor="grab" onPointerDown={(event) => { if (event.target === event.currentTarget) { drag.current = { kind: "pan", startX: event.clientX, startY: event.clientY, pan: context.pan, moved: false }; event.currentTarget.setPointerCapture(event.pointerId) } }} onPointerMove={(event) => { const active = drag.current; if (!active) return; const delta = { x: event.clientX - active.startX, y: event.clientY - active.startY }; active.moved ||= Math.abs(delta.x) > 3 || Math.abs(delta.y) > 3; if (active.kind === "pan") paintViewport({ x: active.pan.x + delta.x, y: active.pan.y + delta.y }, context.zoom); else if (active.nodeElement) active.nodeElement.style.transform = `translate(${delta.x / context.zoom}px, ${delta.y / context.zoom}px)` }} onPointerUp={(event) => { const active = drag.current; if (!active) return; const delta = { x: event.clientX - active.startX, y: event.clientY - active.startY }; if (active.kind === "pan" && active.moved) send({ type: "view.panned", delta }); if (active.kind === "node" && active.id && active.moved) { active.nodeElement!.style.transform = ""; suppressClick.current = true; send({ type: "node.moved", id: active.id, delta }) } drag.current = null }}>
      <Flex position="absolute" top="0" left="0" right="0" height="55px" zIndex="3" align="center" gap="3" px="6" bg="gray.900" borderBottomWidth="1px" borderColor="gray.700" overflowX="auto" onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY }}>
        <Text fontSize="sm" flexShrink="0">Selected:</Text>
        {!selectedItems.length && <Text fontSize="sm" fontStyle="italic" color="gray.400">none</Text>}
        {selectedItems.map((id) => <HStack key={id} flexShrink="0" height="24px" pl="2" pr="1" gap="1" borderWidth="1px" borderColor="gray.600" borderRadius="sm" bg="gray.800"><Box width="7px" height="7px" borderRadius="full" bg={context.completeGraph.nodes[id]?.type === "component" ? "gray.300" : "purple.400"} /><Text fontSize="xs">{id}</Text><IconButton aria-label={`Remove ${id}`} size="2xs" variant="ghost" onClick={() => send({ type: "node.selected", id, additive: true })}><X size={12} /></IconButton></HStack>)}
        {selectedItems.length > 3 && <Button size="xs" variant="ghost" onClick={() => send({ type: "selection.cleared" })}>Deselect all</Button>}
      </Flex>
      <Box ref={gridRef} position="absolute" inset="0" zIndex="0" opacity=".3" bgImage="linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)" bgSize={`${Math.max(20, 100 * context.zoom)}px ${Math.max(20, 100 * context.zoom)}px`} style={{ backgroundPosition: `${context.pan.x}px ${context.pan.y}px` }} pointerEvents="none" />
      <Box ref={contentRef} position="absolute" zIndex="1" transform={`translate(${context.pan.x}px, ${context.pan.y}px) scale(${context.zoom})`} transformOrigin="0 0" style={{ willChange: "transform" }}>{Object.entries(context.graph.adjacencyList).flatMap(([from, targets]) => targets.map((to) => {
        const fromNode = context.graph.nodes[from], toNode = context.graph.nodes[to]
        return fromNode && toNode ? <Edge key={`${from}-${to}`} from={fromNode} to={toNode} selected={context.selected} /> : null
      }))}{Object.values(context.graph.nodes).map((node) => <Node key={node.id} node={node} selected={context.selected.includes(node.id)} related={relatedNodeIds.has(node.id)} onPointerDown={(event) => { event.stopPropagation(); drag.current = { kind: "node", id: node.id, startX: event.clientX, startY: event.clientY, pan: context.pan, nodeElement: event.currentTarget as HTMLElement, moved: false }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) }} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } send({ type: "node.selected", id: node.id, additive: true }) }} />)}</Box>
      {isBusy && <Flex position="absolute" inset="0" align="center" justify="center" bg="blackAlpha.600"><Stack align="center"><Spinner /><Text>Loading and laying out token graph…</Text></Stack></Flex>}
      {state.matches("failure") && <Box position="absolute" top="4" left="4" bg="red.950" p="4" borderRadius="md"><Text>{context.error}</Text></Box>}
      <HStack position="absolute" right="4" bottom="4" bg="gray.900" borderWidth="1px" borderColor="gray.700" borderRadius="md" p="1"><IconButton aria-label="Zoom out" size="sm" onClick={() => send({ type: "view.zoomed", zoom: context.zoom * .8 })}><Minus size={16} /></IconButton><Text fontSize="xs" width="45px" textAlign="center">{Math.round(context.zoom * 100)}%</Text><IconButton aria-label="Zoom in" size="sm" onClick={() => send({ type: "view.zoomed", zoom: context.zoom * 1.2 })}><Plus size={16} /></IconButton><IconButton aria-label="Reset view" size="sm" onClick={() => send({ type: "view.reset" })}><Maximize2 size={15} /></IconButton></HStack>
    </Box>
  </Flex>
}

function Node({ node, selected, related, onPointerDown, onClick }: { node: GraphNode; selected: boolean; related: boolean; onPointerDown: React.PointerEventHandler; onClick: React.MouseEventHandler }) {
  const color = selected ? "yellow" : node.type === "component" ? "cyan" : node.type === "orphan-category" ? "blue" : related ? "purple" : "gray"
  const values = valuesFor(node)
  const rowCount = Math.max(values.length, 1)
  const height = rowCount * 16 + (rowCount - 1) * 2 + 6
  return <Box position="absolute" left={`${node.x}px`} top={`${node.y}px`} width="450px" height={`${height}px`} display="flex" alignItems="center" bg={`${color}.900`} borderWidth="1px" borderColor={selected ? "yellow.300" : `${color}.600`} borderRadius="sm" cursor="pointer" userSelect="none" onPointerDown={onPointerDown} onClick={onClick}><Text pl="26px" fontSize="12px" fontWeight="bold" color={`${color}.100`} pointerEvents="none">{node.id}</Text><Stack position="absolute" right="3px" top="3px" gap="2px" align="end" pointerEvents="none">{values.map((item, index) => <HStack key={`${item.value}-${index}`} gap="0" height="16px" fontSize="10px"><Box px="5px" height="16px" lineHeight="16px" bg={selected ? "yellow.100" : "gray.100"} color="gray.800" borderLeftRadius="2px">{item.path || "*"}</Box><Box px="5px" height="16px" lineHeight="16px" maxWidth="260px" truncate bg={selected ? "yellow.950" : "gray.950"} color="gray.100" borderRightRadius="2px">{item.value}</Box></HStack>)}</Stack></Box>
}

function Edge({ from, to, selected }: { from: GraphNode; to: GraphNode; selected: string[] }) {
  const x1 = from.x + 450, y1 = from.y + 18, x2 = to.x, y2 = to.y + 18, width = Math.max(1, x2 - x1), top = Math.min(y1, y2)
  const highlighted = selected.includes(from.id) || selected.includes(to.id)
  return <svg aria-hidden="true" style={{ position: "absolute", left: x1, top, width, height: Math.abs(y2 - y1) + 1, overflow: "visible", pointerEvents: "none" }}><path d={`M 0 ${y1 - top} C ${width / 3} ${y1 - top}, ${width * 2 / 3} ${y2 - top}, ${width} ${y2 - top}`} stroke={highlighted ? "#d8b4fe" : "#475569"} strokeWidth="2" fill="none" /></svg>
}
