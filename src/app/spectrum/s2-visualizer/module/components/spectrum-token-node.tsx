"use client"

import { Box, HStack, Stack, Text } from "@chakra-ui/react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { memo } from "react"
import { valuesFor } from "../lib/node-values"
import type { SpectrumFlowNode } from "../lib/flow-elements"

export const SpectrumTokenNode = memo(function SpectrumTokenNode({ data }: NodeProps<SpectrumFlowNode>) {
  const { graphNode, isSelected, isSelectionAncestor, isSelectionDescendent, isSelectionDescendentIntersect } = data
  const color = isSelected
    ? "yellow"
    : isSelectionDescendentIntersect || (isSelectionAncestor && isSelectionDescendent)
      ? "orange"
      : isSelectionDescendent
        ? "pink"
        : isSelectionAncestor
          ? "purple"
      : graphNode.type === "component"
        ? "blue"
        : graphNode.type === "orphan-category"
          ? "cyan"
          : "gray"
  const values = valuesFor(graphNode)
  const height = Math.max(values.length, 1) * 18 + 6

  return (
    <Box
      width="450px"
      minHeight={`${height}px`}
      display="flex"
      alignItems="center"
      bg={`${color}.100`}
      borderWidth="1px"
      borderColor={isSelected ? "yellow.500" : `${color}.400`}
      borderRadius="sm"
      cursor="pointer"
      userSelect="none"
      boxShadow="sm"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Text pl="26px" fontSize="12px" fontWeight="bold" color="gray.800">
        {graphNode.id}
      </Text>
      <Stack position="absolute" right="3px" top="3px" gap="2px" align="end" className="nodrag">
        {values.map((item, index) => (
          <HStack key={`${item.value}-${index}`} gap="0" height="16px" fontSize="10px">
            <Box
              px="5px"
              height="16px"
              lineHeight="16px"
              bg={isSelected ? "yellow.200" : "gray.200"}
              color="gray.800"
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
              bg="gray.700"
              color="white"
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
