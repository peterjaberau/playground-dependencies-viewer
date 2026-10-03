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
  ancestorPath: "#a855f7",
  descendentPath: "#ec4899",
  default: "#94a3b8",
} as const

export const GRAPH_EDGE_STYLE = {
  strokeWidth: 2,
  fadedOpacity: 0.3,
} as const
