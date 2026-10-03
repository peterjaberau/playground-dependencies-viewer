"use client"

import { Box, HStack, Stack, Text } from "@chakra-ui/react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { memo } from "react"
import { resolveGraphNodeVisual } from "../lib/graph-color-resolvers"
import { valuesFor } from "../lib/node-values"
import type { SpectrumFlowNode } from "../lib/flow-elements"

export const SpectrumTokenNode = memo(function SpectrumTokenNode({ data }: NodeProps<SpectrumFlowNode>) {
  const { graphNode, hasDownstream, isSelected, isSelectionAncestor, isSelectionDescendent, isSelectionDescendentIntersect } = data
  const visual = resolveGraphNodeVisual({
    type: graphNode.type,
    hasDownstream,
    isSelected,
    isSelectionAncestor,
    isSelectionDescendent,
    isSelectionDescendentIntersect,
  })
  const values = valuesFor(graphNode)
  const height = Math.max(values.length, 1) * 18 + 6

  return (
    <Box
      width="450px"
      minHeight={`${height}px`}
      display="flex"
      alignItems="center"
      // bg={`${visual.color}.${visual.fillShade}`}
      bg={`${visual.color}`}
      borderWidth="1px"
      borderColor={visual.borderColor}
      borderRadius="sm"
      cursor="pointer"
      userSelect="none"
      // boxShadow="sm"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Text pl="26px" fontSize="12px" fontWeight="bold" color={visual.labelTextColor}>
        {graphNode.id}
      </Text>
      <Stack position="absolute" right="3px" top="3px" gap="2px" align="end" className="nodrag">
        {values.map((item, index) => (
          <HStack key={`${item.value}-${index}`} gap="0" height="16px" fontSize="10px">
            <Box
              px="5px"
              height="16px"
              lineHeight="16px"
              bg={visual.valuePathBackground}
              color={visual.labelTextColor}
              borderLeftRadius="2px"
            >
              {item.path || "*"}
            </Box>
            <Box
              px="5px"
              height="16px"
              lineHeight="16px"
              maxWidth="260px"
              truncate
              bg={visual.valueBackground}
              color={visual.valueTextColor}
              borderRightRadius="2px"
            >
              {item.value}
            </Box>
          </HStack>
        ))}
      </Stack>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </Box>
  )
})
