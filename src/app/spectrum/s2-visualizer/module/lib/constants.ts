/**
 * Visual palette for the S2 graph. Node values are Chakra color palettes;
 * edge values are CSS colors consumed directly by XYFlow.
 */
export const GRAPH_NODE_COLORS = {
  selected: "yellow",
  selectionConnection: "orange",
  descendentPath: "pink",
  ancestorPath: "purple",
  component: "blue",
  orphanCategory: "cyan",
  token: "gray",
} as const

export const GRAPH_EDGE_COLORS = {
  selectionConnection: "#f97316",
  selectedChildDescendentPath: "#d8b4fe",
  // ancestorPath: "#a855f7",
  // descendentPath: "#ec4899",
  // default: "#94a3b8",
  ancestorPath: "#000000",
  descendentPath: "#e4e4e7",
  default: "#e4e4e7",
} as const
// #f4f4f5

export const GRAPH_EDGE_STYLE = {
  // Set a CSS color here to override only normal/default edges. When omitted,
  // GRAPH_EDGE_COLORS.default remains the fallback.
  color: "#e4e4e7",
  strokeWidth: 2,
  fadedOpacity: 1,
  normalZIndex: 0,
  highlightedZIndex: 2,
} as const

/*




 */