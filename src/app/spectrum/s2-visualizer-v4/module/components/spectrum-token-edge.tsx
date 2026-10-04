"use client"

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react"
import { memo } from "react"
import type { SpectrumFlowEdge } from "../lib/flow-elements"

/** Renders the standard XYFlow bezier while exposing its resolved palette role. */
export const SpectrumTokenEdge = memo(function SpectrumTokenEdge(props: EdgeProps<SpectrumFlowEdge>) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })

  return (
    <BaseEdge
      id={props.id}
      path={path}
      {...(props.style ? { style: props.style } : {})}
      {...(props.markerStart ? { markerStart: props.markerStart } : {})}
      {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})}
      data-color={props.data?.colorRole ?? "node"}
    />
  )
})
