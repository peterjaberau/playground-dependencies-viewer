export type RawToken = { component?: string; value?: string; sets?: Record<string, RawToken> }
export type RawTokens = Record<string, RawToken>

const sourcePath = "https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/"

/** Fetches source records only. Graph construction belongs to dataMachine. */
export async function fetchTokenData(): Promise<RawTokens> {
  const manifest = await fetch(`${sourcePath}manifest.json`).then(assertOk).then((response) => response.json() as Promise<string[]>)
  const files = await Promise.all(manifest.map((file) => fetch(`${sourcePath}${file}`).then(assertOk).then((response) => response.json() as Promise<RawTokens>)))
  return Object.assign({}, ...files) as RawTokens
}

function assertOk(response: Response) {
  if (!response.ok) throw new Error(`Could not load Spectrum token data (${response.status})`)
  return response
}
