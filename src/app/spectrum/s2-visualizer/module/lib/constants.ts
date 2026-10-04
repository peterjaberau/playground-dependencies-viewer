/**
 * Visual palette for graph nodes. All graph colors are explicit CSS hex.
 *
 * Naming is type-first: `node` is a component, `nodeAtl` is a token, and
 * `nodeOrphan` is an orphan category. `Upstream` denotes an upstream route
 * (or a root with visible children), `Downstream` denotes a selection-descendant
 * route (or visible downstream graph), `Selected` is direct user selection,
 * `SelectedRoute` is an overlapping selected route, and `Leaf` denotes a
 * terminal node.
 */
export const GRAPH_NODE_COLORS = {
  /** Component with no selected route or visible downstream graph. */
  node: { fill: "#f4f4f5", border: "#f4f4f5", label: "#3f3f46" },
  /** Component in a selected downstream route. */
  nodeDownstream: { fill: "#f4f4f5", border: "#f4f4f5", label: "#3f3f46" },
  /** Component/root with visible children or on a selected upstream route. */
  nodeUpstream: { fill: "#e4e4e7", border: "#e4e4e7", label: "#3f3f46" },
  /** Directly selected component without an upstream/downstream route variant. */
  nodeSelected: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Directly selected component in a downstream route. */
  nodeSelectedDownstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Directly selected component with visible children or an upstream route. */
  nodeSelectedUpstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },

  /** Root token, regardless of whether its children are currently visible. */
  nodeAtl: { fill: "#dbeafe", border: "#dbeafe", label: "#173da6" },
  /** Token with visible descendants in the selected downstream graph. */
  nodeAtlDownstream: { fill: "#eff6ff", border: "#eff6ff", label: "#2563eb" },
  /** Token on the selected upstream graph. */
  nodeAtlUpstream: { fill: "#eff6ff", border: "#eff6ff", label: "#2563eb" },
  /** Directly selected token with no directional route variant. */
  nodeAtlSelected: { fill: "#eab308", border: "#eab308", label: "#3f3f46" },
  /** Directly selected token with visible downstream descendants. */
  nodeAtlSelectedDownstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Directly selected token on an upstream route. */
  nodeAtlSelectedUpstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Token in the overlap of selected upstream and downstream routes. */
  nodeAtlSelectedRoute: { fill: "#eab308", border: "#eab308", label: "#3f3f46" },
  /** Terminal token child in a route. */
  nodeAtlLeaf: { fill: "#eff6ff", border: "#eff6ff", label: "#2563eb" },

  /** Orphan-category root, regardless of whether its children are currently visible. */
  nodeOrphan: { fill: "#dbeafe", border: "#dbeafe", label: "#173da6" },
  /** Orphan-category root in a selected downstream route. */
  nodeOrphanDownstream: { fill: "#eff6ff", border: "#eff6ff", label: "#2563eb" },
  /** Orphan-category root with visible children or on an upstream route. */
  nodeOrphanUpstream: { fill: "#d8b4fe", border: "#d8b4fe", label: "#9333ea" },
  /** Directly selected orphan-category root with no directional route variant. */
  nodeOrphanSelected: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Directly selected orphan-category root in a downstream route. */
  nodeOrphanSelectedDownstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Directly selected orphan-category root with visible children or an upstream route. */
  nodeOrphanSelectedUpstream: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** Terminal orphan-category child in a route. */
  nodeOrphanLeaf: { fill: "#eff6ff", border: "#eff6ff", label: "#2563eb" },
} as const


/**
 * Palette for graph edges. Every role supplies base, faded, and highlighted variants.
 *
 * Edge names use the same source-family convention as nodes: `node` for
 * components, `nodeAtl` for tokens, and `nodeOrphan` for orphan categories.
 * The suffix identifies the route the edge belongs to. Base keys (`node`,
 * `nodeAtl`, `nodeOrphan`) are used when an edge belongs to no selected route.
 */
export const GRAPH_EDGE_COLORS = {
  /** Component-origin edge outside a selected route. */
  node: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
  /** Component-origin edge in a downstream route. */
  nodeDownstream: { base: "#dbeafe", faded: "#eff6ff", highlighted: "#be185d" },
  /** Component-origin edge in an upstream route. */
  nodeUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Component-origin edge in selected downstream graph. */
  nodeSelectedDownstream: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#dbeafe" },
  /** Component-origin edge in selected upstream graph. */
  nodeSelectedUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Component-origin edge in a shared selected route. */
  nodeSelectedRoute: { base: "#f97316", faded: "#fdba74", highlighted: "#eab308" },

  /** Token-origin edge outside a selected route. */
  nodeAtl: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
  /** Token-origin edge in a downstream route. */
  nodeAtlDownstream: { base: "#dbeafe", faded: "#eff6ff", highlighted: "#be185d" },
  /** Token-origin edge in an upstream route. */
  nodeAtlUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Token-origin edge in selected downstream graph. */
  nodeAtlSelectedDownstream: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#dbeafe" },
  /** Token-origin edge in selected upstream graph. */
  nodeAtlSelectedUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Token-origin edge in a shared selected route. */
  nodeAtlSelectedRoute: { base: "#f97316", faded: "#fdba74", highlighted: "#eab308" },

  /** Orphan-category-origin edge outside a selected route. */
  nodeOrphan: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
  /** Orphan-category-origin edge in a downstream route. */
  nodeOrphanDownstream: { base: "#dbeafe", faded: "#eff6ff", highlighted: "#be185d" },
  /** Orphan-category-origin edge in an upstream route. */
  nodeOrphanUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Orphan-category-origin edge in selected downstream graph. */
  nodeOrphanSelectedDownstream: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#dbeafe" },
  /** Orphan-category-origin edge in selected upstream graph. */
  nodeOrphanSelectedUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** Orphan-category-origin edge in a shared selected route. */
  nodeOrphanSelectedRoute: { base: "#f97316", faded: "#fdba74", highlighted: "#eab308" },
} as const


/**
 * Palette for the small value and metadata badges rendered inside graph nodes.
 *
 * - metadataBackground: ordinary metadata badge background.
 * - directlySelectedMetadataBackground: metadata badge background for a directly selected node.
 * - tokenValueBackground: resolved token-value badge background.
 * - tokenValueText: text color used in a resolved token-value badge.
 */
export const GRAPH_NODE_VALUE_COLORS = {
  /** Background for a node's ordinary metadata/value badge. */
  metadataBackground: "#e5e7eb",
  /** Background for metadata/value badges on a directly selected node. */
  directlySelectedMetadataBackground: "#fef3c7",
  /** Background for token-value badges, such as a resolved token value. */
  tokenValueBackground: "#374151",
  /** Text shown inside a token-value badge. */
  tokenValueText: "#ffffff",
} as const


export const GRAPH_EDGE_STYLE = {
  // Set a CSS color here to override only normal/default edges. When omitted,
  // GRAPH_EDGE_COLORS.node, nodeAtl, or nodeOrphan remains the fallback.
  color: "#e4e4e7",
  strokeWidth: 2,
  normalZIndex: 0,
  highlightedZIndex: 2,
} as const

/*




 */
