import type { GraphNode } from "./graph-types"

const valuePathSplitter = ":^;"
const valuesListSplitter = ":*;"

export function valuesFor(node: GraphNode) {
  return (node.value ?? "").split(valuesListSplitter).filter(Boolean).map((item) => {
    const [value, path] = item.split(valuePathSplitter)
    return { value, path }
  })
}
