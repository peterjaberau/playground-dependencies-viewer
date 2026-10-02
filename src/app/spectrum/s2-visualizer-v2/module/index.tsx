"use client"

import { Box, Button, Checkbox, Flex, Heading, HStack, IconButton, Input, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect, useRef } from "react"
import { Maximize2, Minus, Plus, Search, X } from "lucide-react"
import { type GraphNode, type GraphState } from "./lib/graph-types"
import { valuesFor } from "./lib/node-values"
import { useDataActor } from "./hooks/use-data-actor"
import { useVisualizerActor } from "./hooks/use-visualizer-actor"
import { RootProvider } from "./providers/root-provider"

export function S2Visualizer() {
  return <RootProvider><S2VisualizerContent /></RootProvider>
}

function S2VisualizerContent() {
  const { dataActor, dataContext: data, completeNodeCount, related, selectionItems } = useDataActor()
  const { visualizerActor, visualizerContext: visualizer, visualizerState, graph  } = useVisualizerActor()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const viewport = useRef({ pan: visualizer.pan, zoom: visualizer.zoom })
  const wheelFrame = useRef<number | null>(null)
  const drag = useRef<{ kind: "pan" | "node"; startX: number; startY: number; pan: { x: number; y: number }; id?: string; nodeElement?: HTMLElement; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  useEffect(() => { viewport.current = { pan: visualizer.pan, zoom: visualizer.zoom } }, [visualizer.pan, visualizer.zoom])

  const paintViewport = (pan: { x: number; y: number }, zoom: number) => {
    if (contentRef.current) contentRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
    if (gridRef.current) { gridRef.current.style.backgroundPosition = `${pan.x}px ${pan.y}px`; gridRef.current.style.backgroundSize = `${Math.max(20, 100 * zoom)}px ${Math.max(20, 100 * zoom)}px` }
  }
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const prior = viewport.current
      const rect = surface.getBoundingClientRect()
      const zooming = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      const zoom = zooming ? Math.max(.15, Math.min(2, prior.zoom * (event.deltaY > 0 ? .9 : 1.1))) : prior.zoom
      const pan = zooming ? { x: event.clientX - rect.left + (prior.pan.x - (event.clientX - rect.left)) * zoom / prior.zoom, y: event.clientY - rect.top + (prior.pan.y - (event.clientY - rect.top)) * zoom / prior.zoom } : { x: prior.pan.x - event.deltaX * 2, y: prior.pan.y - event.deltaY * 2 }
      viewport.current = { pan, zoom }; paintViewport(pan, zoom)
      if (wheelFrame.current === null) wheelFrame.current = requestAnimationFrame(() => { wheelFrame.current = null; visualizerActor.send({ type: "view.changed", pan: viewport.current.pan, zoom: viewport.current.zoom }) })
    }
    surface.addEventListener("wheel", wheel, { passive: false })
    return () => { surface.removeEventListener("wheel", wheel); if (wheelFrame.current !== null) cancelAnimationFrame(wheelFrame.current) }
  }, [visualizerActor])

  const busy = completeNodeCount === 0 || visualizerState.matches("layout")
  return <Flex height="100dvh" bg="white" color="gray.900" overflow="hidden" fontFamily="mono">
    <Box width="250px" flexShrink={0} bg="gray.50" borderRightWidth="1px" borderColor="gray.300" p="4" zIndex="2" overflowY="auto">
      <Heading size="md" mb="1">Spectrum tokens</Heading><Text fontSize="xs" color="gray.600" mb="4">Dependency explorer</Text>
      <Box position="relative" mb="5"><Search size={16} style={{ position: "absolute", left: 10, top: 10, opacity: .6 }} /><Input id="s2-token-search" bg="white" pl="9" size="sm" placeholder="Search tokens" value={data.query} onChange={(event) => dataActor.send({ type: "query.changed", query: event.target.value })} />
        {data.query && <Box position="absolute" top="10" left="0" right="0" bg="white" borderWidth="1px" borderColor="gray.300" borderRadius="md" overflow="hidden" zIndex="5">{data.matches.map((node: GraphNode) => <Button key={node.id} variant="ghost" justifyContent="flex-start" width="100%" size="sm" borderRadius="0" onClick={() => dataActor.send({ type: "node.toggled", id: node.id })}><Text truncate>{node.id}</Text></Button>)}</Box>}
      </Box>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.600">TOKEN SETS</Text><Stack gap="2" mb="6">{["spectrum", "light", "dark", "desktop", "mobile"].map((filter) => <Checkbox.Root key={filter} checked={data.filters.includes(filter)} onCheckedChange={(details) => dataActor.send({ type: "filters.changed", filters: details.checked ? [...data.filters, filter] : data.filters.filter((item: string) => item !== filter) })}><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label textTransform="capitalize">{filter}</Checkbox.Label></Checkbox.Root>)}</Stack>
      <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.600">SELECTED</Text><Stack gap="1">{data.selected.length ? data.selected.map((id: string) => <HStack key={id} justify="space-between"><Text fontSize="xs" truncate>{id}</Text><IconButton aria-label={`Remove ${id}`} size="2xs" variant="ghost" onClick={() => dataActor.send({ type: "node.toggled", id })}><X size={13} /></IconButton></HStack>) : <Text fontSize="xs" color="gray.500">Click a node to inspect its dependencies.</Text>}</Stack>
    </Box>
    <Box ref={surfaceRef} flex="1" position="relative" overflow="hidden" bg="gray.50" cursor="grab" onPointerDown={(event) => { if (event.target === event.currentTarget) { drag.current = { kind: "pan", startX: event.clientX, startY: event.clientY, pan: visualizer.pan, moved: false }; event.currentTarget.setPointerCapture(event.pointerId) } }} onPointerMove={(event) => { const active = drag.current; if (!active) return; const delta = { x: event.clientX - active.startX, y: event.clientY - active.startY }; active.moved ||= Math.abs(delta.x) > 3 || Math.abs(delta.y) > 3; if (active.kind === "pan") paintViewport({ x: active.pan.x + delta.x, y: active.pan.y + delta.y }, visualizer.zoom); else if (active.nodeElement) active.nodeElement.style.transform = `translate(${delta.x / visualizer.zoom}px, ${delta.y / visualizer.zoom}px)` }} onPointerUp={(event) => { const active = drag.current; if (!active) return; const delta = { x: event.clientX - active.startX, y: event.clientY - active.startY }; if (active.kind === "pan" && active.moved) visualizerActor.send({ type: "view.panned", delta }); if (active.kind === "node" && active.id && active.moved) { active.nodeElement!.style.transform = ""; suppressClick.current = true; visualizerActor.send({ type: "node.moved", id: active.id, delta }) } drag.current = null }}>
      <Flex position="absolute" top="0" left="0" right="0" height="55px" zIndex="3" align="center" gap="3" px="6" bg="white" borderBottomWidth="1px" borderColor="gray.300" overflowX="auto"><Text fontSize="sm" flexShrink="0">Selected:</Text>{!selectionItems.length && <Text fontSize="sm" fontStyle="italic" color="gray.500">none</Text>}{selectionItems.map((item: { id: string; type: GraphNode["type"] }) => <HStack key={item.id} flexShrink="0" height="24px" pl="2" pr="1" gap="1" borderWidth="1px" borderColor="gray.300" borderRadius="sm" bg="gray.100"><Box width="7px" height="7px" borderRadius="full" bg={item.type === "component" ? "gray.500" : "purple.500"} /><Text fontSize="xs">{item.id}</Text><IconButton aria-label={`Remove ${item.id}`} size="2xs" variant="ghost" onClick={() => dataActor.send({ type: "node.toggled", id: item.id })}><X size={12} /></IconButton></HStack>)}{selectionItems.length > 3 && <Button size="xs" variant="ghost" onClick={() => dataActor.send({ type: "selection.cleared" })}>Deselect all</Button>}</Flex>
      <Box ref={gridRef} position="absolute" inset="0" zIndex="0" opacity=".7" bgImage="linear-gradient(#d9e2ec 1px, transparent 1px), linear-gradient(90deg, #d9e2ec 1px, transparent 1px)" bgSize={`${Math.max(20, 100 * visualizer.zoom)}px ${Math.max(20, 100 * visualizer.zoom)}px`} style={{ backgroundPosition: `${visualizer.pan.x}px ${visualizer.pan.y}px` }} pointerEvents="none" />
      <Box ref={contentRef} position="absolute" zIndex="1" transform={`translate(${visualizer.pan.x}px, ${visualizer.pan.y}px) scale(${visualizer.zoom})`} transformOrigin="0 0" style={{ willChange: "transform" }}>{Object.entries(graph.adjacencyList).flatMap(([from, targets]) => targets.map((to) => { const a = graph.nodes[from], b = graph.nodes[to]; return a && b ? <Edge key={`${from}-${to}`} from={a} to={b} selected={data.selected} /> : null }))}{Object.values(graph.nodes).map((node) => <Node key={node.id} node={node} selected={data.selected.includes(node.id)} related={related.includes(node.id)} onPointerDown={(event) => { event.stopPropagation(); drag.current = { kind: "node", id: node.id, startX: event.clientX, startY: event.clientY, pan: visualizer.pan, nodeElement: event.currentTarget as HTMLElement, moved: false }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) }} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return }; dataActor.send({ type: "node.toggled", id: node.id }) }} />)}</Box>
      {busy && <Flex position="absolute" inset="0" align="center" justify="center" bg="whiteAlpha.800"><Stack align="center"><Spinner /><Text>Loading and laying out token graph…</Text></Stack></Flex>}
      {data.error && <Box position="absolute" top="4" left="4" bg="red.100" p="4" borderRadius="md"><Text>{data.error}</Text></Box>}
      <HStack position="absolute" right="4" bottom="4" bg="white" borderWidth="1px" borderColor="gray.300" borderRadius="md" p="1"><IconButton aria-label="Zoom out" size="sm" onClick={() => visualizerActor.send({ type: "view.changed", pan: visualizer.pan, zoom: visualizer.zoom * .8 })}><Minus size={16} /></IconButton><Text fontSize="xs" width="45px" textAlign="center">{Math.round(visualizer.zoom * 100)}%</Text><IconButton aria-label="Zoom in" size="sm" onClick={() => visualizerActor.send({ type: "view.changed", pan: visualizer.pan, zoom: visualizer.zoom * 1.2 })}><Plus size={16} /></IconButton><IconButton aria-label="Reset view" size="sm" onClick={() => visualizerActor.send({ type: "view.reset" })}><Maximize2 size={15} /></IconButton></HStack>
    </Box>
  </Flex>
}

function Node({ node, selected, related, onPointerDown, onClick }: { node: GraphNode; selected: boolean; related: boolean; onPointerDown: React.PointerEventHandler; onClick: React.MouseEventHandler }) {
  const color = selected ? "yellow" : node.type === "component" ? "blue" : node.type === "orphan-category" ? "cyan" : related ? "purple" : "gray"
  const values = valuesFor(node); const rows = Math.max(values.length, 1); const height = rows * 16 + (rows - 1) * 2 + 6
  return <Box position="absolute" left={`${node.x}px`} top={`${node.y}px`} width="450px" height={`${height}px`} display="flex" alignItems="center" bg={`${color}.100`} borderWidth="1px" borderColor={selected ? "yellow.500" : `${color}.400`} borderRadius="sm" cursor="pointer" userSelect="none" onPointerDown={onPointerDown} onClick={onClick}><Text pl="26px" fontSize="12px" fontWeight="bold" color="gray.800" pointerEvents="none">{node.id}</Text><Stack position="absolute" right="3px" top="3px" gap="2px" align="end" pointerEvents="none">{values.map((item, index) => <HStack key={`${item.value}-${index}`} gap="0" height="16px" fontSize="10px"><Box px="5px" height="16px" lineHeight="16px" bg={selected ? "yellow.200" : "gray.200"} color="gray.800" borderLeftRadius="2px">{item.path || "*"}</Box><Box px="5px" height="16px" lineHeight="16px" maxWidth="260px" truncate bg="gray.700" color="white" borderRightRadius="2px">{item.value}</Box></HStack>)}</Stack></Box>
}

function Edge({ from, to, selected }: { from: GraphNode; to: GraphNode; selected: string[] }) {
  const x1 = from.x + 450, y1 = from.y + 18, x2 = to.x, y2 = to.y + 18, width = Math.max(1, x2 - x1), top = Math.min(y1, y2)
  return <svg aria-hidden="true" style={{ position: "absolute", left: x1, top, width, height: Math.abs(y2 - y1) + 1, overflow: "visible", pointerEvents: "none" }}><path d={`M 0 ${y1 - top} C ${width / 3} ${y1 - top}, ${width * 2 / 3} ${y2 - top}, ${width} ${y2 - top}`} stroke={selected.includes(from.id) || selected.includes(to.id) ? "#7e22ce" : "#94a3b8"} strokeWidth="2" fill="none" /></svg>
}
