/**
 * Visual palette for the S2 graph. Node values are Chakra color palettes;
 * edge values are CSS colors consumed directly by XYFlow.
 */
export const GRAPH_NODE_COLORS = {
  selected: "#eab308",
  selectionConnection: "#f97316",
  // Chakra's pink palette is the light-theme equivalent used for Spectrum's
  // fuchsia descendant treatment.
  descendentPath: "#dbeafe",
  component: "#f4f4f5",
  orphanCategory: "#a5f3fc",
  token: "#dbeafe",
} as const

/** Chakra palette steps used to mirror the original structural-node emphasis. */
export const GRAPH_NODE_STYLE = {
  defaultFillShade: 200,
  selectedFillShade: 200,
  selectionConnectionFillShade: 600,
  structuralNodeWithDownstreamFillShade: 300,
  borderShade: 400,
  selectedBorderShade: 500,
  labelTextColor: "#27272a",
  defaultValuePathBackground: "#e4e4e7",
  selectedValuePathBackground: "#fef08a",
  valueBackground: "#3f3f46",
  valueTextColor: "white",
} as const

export const GRAPH_EDGE_COLORS = {
  // These three values mirror the original role color at normal, faded
  // (line value -200), and highlighted (line value +200) states.
  // selectionConnection: { base: "#f97316", faded: "#fdba74", highlighted: "#f97316" },
  // selectedChildDescendentPath: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#9333ea" },
  // ancestorPath: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#7e22ce" },
  // descendentPath: { base: "#dbeafe", faded: "#fbcfe8", highlighted: "#be185d" },
  // default: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
  selectionConnection: { base: "#f97316", faded: "#fdba74", highlighted: "#f97316" },
  selectedChildDescendentPath: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#9333ea" },
  ancestorPath: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#7e22ce" },
  descendentPath: { base: "#dbeafe", faded: "#fbcfe8", highlighted: "#be185d" },
  default: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
} as const
// #f4f4f5

export const GRAPH_EDGE_STYLE = {
  // Set a CSS color here to override only normal/default edges. When omitted,
  // GRAPH_EDGE_COLORS.default remains the fallback.
  color: "#e4e4e7",
  strokeWidth: 2,
  normalZIndex: 0,
  highlightedZIndex: 2,
} as const

/*




 */
