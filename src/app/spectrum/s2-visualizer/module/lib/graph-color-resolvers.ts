import { GRAPH_EDGE_COLORS, GRAPH_EDGE_STYLE, GRAPH_NODE_COLORS, GRAPH_NODE_VALUE_COLORS } from "./constants"
import type { GraphNode } from "./graph-types"

export type GraphNodeColorRole = keyof typeof GRAPH_NODE_COLORS
export type GraphEdgeColorRole = keyof typeof GRAPH_EDGE_COLORS

type NodeColorInput = {
  type: GraphNode["type"]
  isSelected: boolean
  isSelectionAncestor: boolean
  isSelectionDescendent: boolean
  isSelectionDescendentIntersect: boolean
  hasDownstream: boolean
}

/**
 * Ordered to match the original visualizer's selection precedence. Keep this
 * ordering here rather than duplicating it in the React node component.
 */
export function resolveGraphNodeColorRole(input: NodeColorInput): GraphNodeColorRole {
  if (input.isSelected) return "directlySelectedNode"
  if (input.type === "component") return input.hasDownstream ? "componentNodeWithVisibleChildren" : "componentNode"
  if (input.type === "orphan-category") return input.hasDownstream ? "orphanCategoryNodeWithVisibleChildren" : "orphanCategoryNode"
  // From this point the source implementation is inside `type === "token"`.
  if (input.isSelectionDescendentIntersect || (input.isSelectionAncestor && input.isSelectionDescendent)) return "sharedSelectedRouteToken"
  if (input.isSelectionDescendent) return "downstreamToken"
  // Non-descendant tokens—including upstream ancestors—are purple.
  return "nonDownstreamToken"
}

export function resolveGraphNodeVisual(input: NodeColorInput) {
  const role = resolveGraphNodeColorRole(input)
  const palette = GRAPH_NODE_COLORS[role]
  return {
    role,
    fillColor: palette.fill,
    borderColor: palette.border,
    labelTextColor: palette.label,
    valuePathBackground: input.isSelected ? GRAPH_NODE_VALUE_COLORS.directlySelectedMetadataBackground : GRAPH_NODE_VALUE_COLORS.metadataBackground,
    valueBackground: GRAPH_NODE_VALUE_COLORS.tokenValueBackground,
    valueTextColor: GRAPH_NODE_VALUE_COLORS.tokenValueText,
  }
}

type EdgeColorInput = {
  isOnSelectedChildDescendentPath: boolean
  isSelectionConnection: boolean
  isOnAncestorPath: boolean
  isOnDescendentPath: boolean
  isFaded: boolean
  isHighlighted: boolean
}

/** Edge-role precedence is centralized so color and z-index cannot diverge. */
export function resolveGraphEdgeColorRole(input: EdgeColorInput): GraphEdgeColorRole {
  if (input.isOnSelectedChildDescendentPath) return "directlySelectedTokenDownstream"
  if (input.isSelectionConnection) return "sharedSelectedRoute"
  if (input.isOnAncestorPath) return "selectedTokenUpstream"
  if (input.isOnDescendentPath) return "selectedScopeDownstream"
  return "unrelated"
}

export function resolveGraphEdgeVisual(input: EdgeColorInput) {
  const role = resolveGraphEdgeColorRole(input)
  const state = input.isHighlighted ? "highlighted" : input.isFaded ? "faded" : "base"
  // Upstream edges retain their visual highlight, but remain below nodes and
  // other elevated selection routes so they do not obscure the graph.
  const shouldElevate = input.isHighlighted && role !== "selectedTokenUpstream"
  const color = role === "unrelated" && state === "base"
    ? GRAPH_EDGE_STYLE.color ?? GRAPH_EDGE_COLORS.unrelated.base
    : GRAPH_EDGE_COLORS[role][state]
  return {
    role,
    color,
    zIndex: shouldElevate ? GRAPH_EDGE_STYLE.highlightedZIndex : GRAPH_EDGE_STYLE.normalZIndex,
  }
}


/*
switch (this.role) {
        case "selectionConnection":
          hue = "orange";
          lineValue = 300;
          textValue = 1100;
          break;
        case "ancestorPath":
          hue = "purple";
          break;
        case "descendentPath":
          hue = "fuchsia";
          break;
      }


// determine colors
// https://spectrum.adobe.com/page/color-palette/
if (this.selected) {
  this.fillColor = "--spectrum-yellow-visual-color";
  this.textColor = "--spectrum-yellow-100";
} else {
  // debug color - should NOT see any celery&#xA;  let hue = "celery";
  let fillValue = 200;
  let textValue = 900;
  // token colors...&#xA;  if (this.type === "token") {
    // upstream tokens are different than downstream&#xA;    hue = this.selectionDescendent ? "fuchsia" : "purple";
    // overlaps/intersections are highlighted&#xA;    if (
      this.isIntersect ||
      (this.selectionDescendent && this.selectionAncestor)
    ) {
      hue = "orange";
      fillValue = 600;
      textValue = 1300;
    }
    // component colors...&#xA;  } else if (this.type === "component") {
    hue = "gray";
    // highlighted if has downstream graph&#xA;    if (this.hasDownstream) {
      fillValue = 300;
    }
    // orphan category colors...&#xA;  } else if (this.type === "orphan-category") {
    hue = "cyan";
    // highlighted if has downstream graph&#xA;    if (this.hasDownstream) {
      fillValue = 300;
    }
  }
  // DARKEN the values if the node&#xA;  // is 'faded' relative to the&#xA;  // currently configured value...&#xA;  if (this.isFaded) {
    fillValue -= 100;
    textValue -= 400;
  }

  if (this.hoverUpstream) {
    textValue = Math.min(1300, textValue + 400);
  }

  this.fillColor = `--spectrum-${hue}-${fillValue}`;
  this.textColor = `--spectrum-${hue}-${textValue}`;
}
 */
