/** Visual palette for the S2 graph. All graph colors are explicit CSS hex. */
export const GRAPH_NODE_COLORS = {
  component: { fill: "#f4f4f5", border: "#e4e4e7", label: "#3f3f46" },
  selected: { fill: "#fef3c7", border: "#eab308", label: "#713f12" },
  selectionConnection: { fill: "#ffedd5", border: "#f97316", label: "#7c2d12" },
  descendentPath: { fill: "#dbeafe", border: "#dbeafe", label: "#173da6" },
  componentWithDownstream: { fill: "#d1d5db", border: "#9ca3af", label: "#374151" },
  orphanCategory: { fill: "#ecfeff", border: "#06b6d4", label: "#164e63" },
  orphanCategoryWithDownstream: { fill: "#cffafe", border: "#06b6d4", label: "#164e63" },
  token: { fill: "#f3e8ff", border: "#a855f7", label: "#581c87" },
  // selected: { fill: "#fef3c7", border: "#eab308", label: "#713f12" },
  // selectionConnection: { fill: "#ffedd5", border: "#f97316", label: "#7c2d12" },
  // descendentPath: { fill: "#fce7f3", border: "#ec4899", label: "#831843" },
  // component: { fill: "#e5e7eb", border: "#9ca3af", label: "#374151" },
  // componentWithDownstream: { fill: "#d1d5db", border: "#9ca3af", label: "#374151" },
  // orphanCategory: { fill: "#ecfeff", border: "#06b6d4", label: "#164e63" },
  // orphanCategoryWithDownstream: { fill: "#cffafe", border: "#06b6d4", label: "#164e63" },
  // token: { fill: "#f3e8ff", border: "#a855f7", label: "#581c87" },
} as const

export const GRAPH_NODE_VALUE_COLORS = {
  defaultPathBackground: "#e5e7eb",
  selectedPathBackground: "#fef3c7",
  background: "#374151",
  text: "#ffffff",
  // defaultPathBackground: "#e5e7eb",
  // selectedPathBackground: "#fef3c7",
  // background: "#374151",
  // text: "#ffffff",
} as const

export const GRAPH_EDGE_COLORS = {
  selectionConnection: { base: "#f97316", faded: "#fdba74", highlighted: "#c2410c" },
  selectedChildDescendentPath: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#9333ea" },
  ancestorPath: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#7e22ce" },
  descendentPath: { base: "#ec4899", faded: "#fbcfe8", highlighted: "#be185d" },
  default: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
  // selectionConnection: { base: "#f97316", faded: "#fdba74", highlighted: "#c2410c" },
  // selectedChildDescendentPath: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#9333ea" },
  // ancestorPath: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#7e22ce" },
  // descendentPath: { base: "#ec4899", faded: "#fbcfe8", highlighted: "#be185d" },
  // default: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
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
