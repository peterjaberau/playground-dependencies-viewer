import { type GraphNode, type GraphState } from "./graph-types"

type RawToken = { component?: string; value?: string; sets?: Record<string, RawToken> }
type RawTokens = Record<string, RawToken>

const sourcePath = "https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/"
const valuePathSplitter = ":^;"
const valuesListSplitter = ":*;"

export async function loadGraph(filters: string[]): Promise<{ graph: GraphState; components: string[] }> {
  const manifest = await fetch(`${sourcePath}manifest.json`).then(assertOk).then((response) => response.json() as Promise<string[]>)
  const files = await Promise.all(manifest.map((file) => fetch(`${sourcePath}${file}`).then(assertOk).then((response) => response.json() as Promise<RawTokens>)))
  const tokens = Object.assign({}, ...files) as RawTokens
  const graph: GraphState = { width: 0, height: 0, nodes: {}, adjacencyList: {} }
  const components: string[] = []
  const addNode = (node: GraphNode) => { graph.nodes[node.id] ??= node }
  const connect = (from: string, to: string, label?: string) => {
    const targets = graph.adjacencyList[from] ?? (graph.adjacencyList[from] = [])
    if (!targets.includes(to)) targets.push(to)
    if (label) (graph.nodes[from]!.adjacencyLabels ??= {})[to] = label
  }
  for (const [id, token] of Object.entries(tokens)) {
    if (token.component) { addNode({ type: "component", id: token.component, x: 0, y: 0 }); if (!components.includes(token.component)) components.push(token.component); connect(token.component, id) }
    addNode({ type: "token", id, x: 0, y: 0 })
    const values: Array<{ value: string; path: string[] }> = []
    if (token.value) values.push({ value: token.value, path: [] })
    const pending = token.sets ? [{ sets: token.sets, path: [] as string[] }] : []
    while (pending.length) {
      const current = pending.pop()!
      for (const filter of filters) {
        const item = current.sets[filter]
        if (!item) continue
        const path = [...current.path, filter]
        if (item.value) values.push({ value: item.value, path })
        if (item.sets) pending.push({ sets: item.sets, path })
      }
    }
    const rawValues: string[] = []
    for (const found of values) {
      const value = String(found.value)
      if (value.startsWith("{") && value.endsWith("}")) {
        const target = value.slice(1, -1)
        const previous = graph.nodes[id]!.adjacencyLabels?.[target]?.split(",") ?? []
        connect(id, target, [...new Set([...previous, ...found.path])].join(","))
      } else rawValues.push(found.path.length ? `${value}${valuePathSplitter}${found.path.join(",")}` : value)
    }
    if (rawValues.length) graph.nodes[id]!.value = rawValues.join(valuesListSplitter)
  }
  const targets = new Set(Object.values(graph.adjacencyList).flat())
  const categories = new Set(Object.keys(graph.nodes).filter((id) => !targets.has(id) && graph.nodes[id]!.type === "token").map((id) => id.split("-")[0]!))
  for (const category of categories) { const categoryId = `${category}-*`; addNode({ type: "orphan-category", id: categoryId, x: 0, y: 0 }); for (const id of Object.keys(tokens)) if (id.startsWith(`${category}-`)) connect(categoryId, id) }
  return { graph, components: components.sort() }
}

function assertOk(response: Response) { if (!response.ok) throw new Error(`Could not load Spectrum token data (${response.status})`); return response }
