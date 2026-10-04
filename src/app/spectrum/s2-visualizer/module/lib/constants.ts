/**
 * Visual palette for graph nodes. All graph colors are explicit CSS hex.
 *
 * - componentNode: component with no visible children.
 * - directlySelectedNode: any node chosen directly by the user.
 * - sharedSelectedRouteToken: token in the overlapping upstream/downstream selected route.
 * - downstreamToken: token reachable downstream from the selection.
 * - componentNodeWithVisibleChildren: component whose children are visible.
 * - orphanCategoryNode: orphan-category root with no visible children.
 * - orphanCategoryNodeWithVisibleChildren: orphan-category root whose children are visible.
 * - nonDownstreamToken: token outside selection downstream, including upstream tokens.
 */
export const GRAPH_NODE_COLORS = {
  /** A component node with no currently visible child graph. */
  componentNode: { fill: "#f4f4f5", border: "#f4f4f5", label: "#3f3f46" },
  /** Any node directly chosen by the user, regardless of its graph type. */
  directlySelectedNode: { fill: "#eab308", border: "#eab308", label: "#fef08a" },
  /** A token where selected-node upstream and downstream routes overlap. */
  sharedSelectedRouteToken: { fill: "#eab308", border: "#eab308", label: "#3f3f46" },
  /** A token reachable downstream from the current selection. */
  downstreamToken: { fill: "#dbeafe", border: "#dbeafe", label: "#173da6" },
  /** A component node whose child graph is currently visible. */
  componentNodeWithVisibleChildren: { fill: "#e4e4e7", border: "#e4e4e7", label: "#3f3f46" },
  /** An orphan-category root with no currently visible child graph. */
  orphanCategoryNode: { fill: "#e9d5ff", border: "#e9d5ff", label: "#9333ea" },
  /** An orphan-category root whose child graph is currently visible. */
  orphanCategoryNodeWithVisibleChildren: { fill: "#d8b4fe", border: "#d8b4fe", label: "#9333ea" },
  /** A token outside the current selection's downstream graph, including upstream tokens. */
  nonDownstreamToken: { fill: "#eff6ff", border: "#eff6ff", label: "#a3cfff" },
} as const


/**
 * Palette for graph edges. Every role supplies base, faded, and highlighted variants.
 *
 * - sharedSelectedRoute: an edge in the overlap of selected upstream/downstream routes.
 * - directlySelectedTokenDownstream: an edge from a directly selected token to its descendants.
 * - selectedTokenUpstream: an edge from a selected token toward its component/root.
 * - selectedScopeDownstream: another downstream edge within the selected graph scope.
 * - unrelated: an edge outside every selection-related route.
 */
export const GRAPH_EDGE_COLORS = {
  /** An edge on the shared portion of selected nodes' upstream/downstream routes. */
  sharedSelectedRoute: { base: "#f97316", faded: "#fdba74", highlighted: "#eab308" },
  /** An edge flowing down from a directly selected token to its descendants. */
  directlySelectedTokenDownstream: { base: "#d8b4fe", faded: "#ede9fe", highlighted: "#dbeafe" },
  /** An edge flowing upstream from a selected token toward its component/root. */
  selectedTokenUpstream: { base: "#a855f7", faded: "#e9d5ff", highlighted: "#eff6ff" },
  /** A downstream edge in the selected scope that is not directly selected-token descent. */
  selectedScopeDownstream: { base: "#dbeafe", faded: "#eff6ff", highlighted: "#be185d" },
  /** An edge outside all selection-related routes. */
  unrelated: { base: "#94a3b8", faded: "#cbd5e1", highlighted: "#64748b" },
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
  // GRAPH_EDGE_COLORS.unrelated remains the fallback.
  color: "#e4e4e7",
  strokeWidth: 2,
  normalZIndex: 0,
  highlightedZIndex: 2,
} as const

/*




 */
