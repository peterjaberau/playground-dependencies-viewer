"use client"

import { Box, Button, Checkbox, Flex, Heading, HStack, IconButton, Input, Spinner, Stack, Text } from "@chakra-ui/react"
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  getViewportForBounds,
  useReactFlow,
  type NodeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
  type OnMoveEnd,
  type OnNodeDrag,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Search, X } from "lucide-react"
import { useEffect } from "react"
import { SpectrumTokenNode } from "./components/spectrum-token-node"
import { SpectrumTokenEdge } from "./components/spectrum-token-edge"
import { useDataActor } from "./hooks/use-data-actor"
import { useGraphActor } from "./hooks/use-graph-actor"
import { useRootActor } from "./hooks/use-root-actor"
import { RootProvider } from "./providers/root-provider"
import type { SpectrumFlowNode, SpectrumFlowNodeData } from "./lib/flow-elements"

const nodeTypes: NodeTypes = { spectrumToken: SpectrumTokenNode }
const edgeTypes: EdgeTypes = { spectrumToken: SpectrumTokenEdge }

export function S2Visualizer() {
  return (
    <RootProvider>
      <ReactFlowProvider>
        <S2VisualizerContent />
      </ReactFlowProvider>
    </RootProvider>
  )
}

function S2VisualizerContent() {
  const rootActor = useRootActor()
  const { dataActor, dataContext: data, completeNodeCount, selectionItems } = useDataActor()
  const { graphActor, graphContext: graph } = useGraphActor()
  const busy = completeNodeCount === 0 || graph.nodes.length === 0

  const onNodeClick: NodeMouseHandler = (_, node) => dataActor.send({ type: "selection.changed", id: node.id })
  const onNodeDragStop: OnNodeDrag = (_, node) =>
    graphActor.send({ type: "node.moved", id: node.id, position: node.position })
  const onMoveEnd: OnMoveEnd = (_, viewport) => graphActor.send({ type: "viewport.changed", viewport })

  return (
    <Flex height="100dvh" bg="white" color="gray.900" overflow="hidden" fontFamily="mono">
      <Box
        width="250px"
        flexShrink={0}
        bg="gray.50"
        borderRightWidth="1px"
        borderColor="gray.300"
        p="4"
        zIndex="2"
        overflowY="auto"
      >
        <Heading size="md" mb="1">
          Spectrum tokens
        </Heading>
        <Text fontSize="xs" color="gray.600" mb="4">
          Dependency explorer
        </Text>
        <Box position="relative" mb="5">
          <Search size={16} style={{ position: "absolute", left: 10, top: 10, opacity: 0.6 }} />
          <Input
            id="s2-token-search"
            bg="white"
            pl="9"
            size="sm"
            placeholder="Search tokens"
            value={data.query}
            onChange={(event) => dataActor.send({ type: "query.changed", query: event.target.value })}
          />
          {data.query && (
            <Box
              position="absolute"
              top="10"
              left="0"
              right="0"
              bg="white"
              borderWidth="1px"
              borderColor="gray.300"
              borderRadius="md"
              overflow="hidden"
              zIndex="5"
            >
              {data.matches.map((node) => (
                <Button
                  key={node.id}
                  variant="ghost"
                  justifyContent="flex-start"
                  width="100%"
                  size="sm"
                  borderRadius="0"
                  onClick={() => dataActor.send({ type: "selection.changed", id: node.id })}
                >
                  <Text truncate>{node.id}</Text>
                </Button>
              ))}
            </Box>
          )}
        </Box>
        <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.600">
          TOKEN SETS
        </Text>
        <Stack gap="2" mb="6">
          {["spectrum", "light", "dark", "desktop", "mobile"].map((filter) => (
            <Checkbox.Root
              key={filter}
              checked={data.filters.includes(filter)}
              onCheckedChange={(details) =>
                dataActor.send({
                  type: "filters.changed",
                  filters: details.checked ? [...data.filters, filter] : data.filters.filter((item) => item !== filter),
                })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label textTransform="capitalize">{filter}</Checkbox.Label>
            </Checkbox.Root>
          ))}
        </Stack>
        <Stack gap="2" mb="6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => console.log("S2 root machine context", rootActor.getSnapshot().context)}
          >
            Root
          </Button>
          <Button size="sm" variant="outline" onClick={() => console.log("S2 graph machine context", graph)}>
            Graph
          </Button>
          <Button size="sm" variant="outline" onClick={() => console.log("S2 data machine context", data)}>
            Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dataActor.send({ type: "meta.generate" })
              console.log("S2 data machine meta", dataActor.getSnapshot().context.meta)
            }}
          >
            Meta
          </Button>
        </Stack>
        <Text fontSize="xs" fontWeight="bold" mb="2" color="gray.600">
          SELECTED
        </Text>
        <Stack gap="1">
          {data.selected.length ? (
            data.selected.map((id) => (
              <HStack key={id} justify="space-between">
                <Text fontSize="xs" truncate>
                  {id}
                </Text>
                <IconButton
                  aria-label={`Remove ${id}`}
                  size="2xs"
                  variant="ghost"
                  onClick={() => dataActor.send({ type: "selection.changed", id })}
                >
                  <X size={13} />
                </IconButton>
              </HStack>
            ))
          ) : (
            <Text fontSize="xs" color="gray.500">
              Click a node to inspect its dependencies.
            </Text>
          )}
        </Stack>
      </Box>
      <Box flex="1" position="relative" minWidth="0" bg="white">
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="55px"
          zIndex="3"
          align="center"
          gap="3"
          px="6"
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.300"
          overflowX="auto"
        >
          <Text fontSize="sm" flexShrink="0">
            Selected:
          </Text>
          {!selectionItems.length && (
            <Text fontSize="sm" fontStyle="italic" color="gray.500">
              none
            </Text>
          )}
          {selectionItems.map((item) => (
            <HStack
              key={item.id}
              flexShrink="0"
              height="24px"
              pl="2"
              pr="1"
              gap="1"
              borderWidth="1px"
              borderColor="gray.300"
              borderRadius="sm"
              bg="gray.100"
            >
              <Box
                width="7px"
                height="7px"
                borderRadius="full"
                bg={item.type === "component" ? "gray.500" : "purple.500"}
              />
              <Text fontSize="xs">{item.id}</Text>
              <IconButton
                aria-label={`Remove ${item.id}`}
                size="2xs"
                variant="ghost"
                onClick={() => dataActor.send({ type: "selection.changed", id: item.id })}
              >
                <X size={12} />
              </IconButton>
            </HStack>
          ))}
          {selectionItems.length > 3 && (
            <Button size="xs" variant="ghost" onClick={() => dataActor.send({ type: "selection.cleared" })}>
              Deselect all
            </Button>
          )}
        </Flex>
        <Box position="absolute" top="55px" insetInline="0" bottom="0">
          <ReactFlow
            style={{ width: "100%", height: "100%" }}
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={graph.viewport}
            onMoveEnd={onMoveEnd}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            fitView={false}
            panOnDrag
            panOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            nodesConnectable={false}
            elementsSelectable={false}
            onlyRenderVisibleElements
            minZoom={0.15}
            maxZoom={2}
          >
            <SelectionFocus focusRequest={graph.focusRequest} nodeIds={graph.focusNodeIds} nodes={graph.nodes} />
            <Background gap={20} size={1} color="#d9e2ec" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) =>
                (node.data as SpectrumFlowNodeData).graphNode.type === "component" ? "#63b3ed" : "#a0aec0"
              }
            />
          </ReactFlow>
        </Box>
        {busy && (
          <Flex position="absolute" inset="0" align="center" justify="center" bg="whiteAlpha.800" zIndex="4">
            <Stack align="center">
              <Spinner />
              <Text>Loading and laying out token graph…</Text>
            </Stack>
          </Flex>
        )}
        {data.error && (
          <Box position="absolute" top="16" left="4" bg="red.100" p="4" borderRadius="md" zIndex="5">
            <Text>{data.error}</Text>
          </Box>
        )}
        {graph.error && (
          <Box position="absolute" top="16" left="4" bg="red.100" p="4" borderRadius="md" zIndex="5">
            <Text>{graph.error}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  )
}

function SelectionFocus({
  focusRequest,
  nodeIds,
  nodes,
}: {
  focusRequest: number
  nodeIds: string[]
  nodes: SpectrumFlowNode[]
}) {
  const { setViewport } = useReactFlow()

  useEffect(() => {
    if (!focusRequest || !nodeIds.length) return
    const frame = requestAnimationFrame(() => {
      const selectedNodes = nodes.filter((node) => nodeIds.includes(node.id))
      if (!selectedNodes.length) return
      const bounds = selectedNodes.reduce(
        (frame, node) => ({
          x: Math.min(frame.x, node.position.x - 50),
          y: Math.min(frame.y, node.position.y - 50),
          x2: Math.max(frame.x2, node.position.x + 500),
          y2: Math.max(frame.y2, node.position.y + 70),
        }),
        { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity },
      )
      const viewport = getViewportForBounds(
        { x: bounds.x, y: bounds.y, width: bounds.x2 - bounds.x, height: bounds.y2 - bounds.y },
        window.innerWidth - 250,
        window.innerHeight - 55,
        0.1,
        2,
        0,
      )
      setViewport(viewport, { duration: 350 })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequest, nodeIds, nodes, setViewport])

  return null
}
