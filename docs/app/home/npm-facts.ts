import { useEffect, useState } from "react"

/**
 * Release facts for the home page, read from npm's public APIs. The build
 * fetches them once and prerenders them; the browser refreshes them after the
 * page has loaded. A request that fails changes nothing on the page.
 */
export type NpmFacts = {
  version: string
  lastMonth: number
}

const REGISTRY = "https://registry.npmjs.org"
const DOWNLOADS = "https://api.npmjs.org/downloads/point/last-month"
const TIMEOUT_MS = 5000

export const NPM_PACKAGE_URL = "https://www.npmjs.com/package/ardo"

async function readJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return data
  } catch {
    return null
  }
}

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined
}

/** The latest version and last month's downloads, or null when npm did not answer. */
export async function fetchNpmFacts(name: string): Promise<NpmFacts | null> {
  const [latest, downloads] = await Promise.all([
    readJson(`${REGISTRY}/${encodeURIComponent(name)}/latest`),
    readJson(`${DOWNLOADS}/${encodeURIComponent(name)}`),
  ])
  const version = field(latest, "version")
  const lastMonth = field(downloads, "downloads")
  if (typeof version !== "string" || typeof lastMonth !== "number") return null
  return { version, lastMonth }
}

/** Starts from the build-time facts and swaps in fresher ones once npm answers. */
export function useLiveNpmFacts(name: string, initial: NpmFacts | null): NpmFacts | null {
  const [facts, setFacts] = useState(initial)

  useEffect(() => {
    let active = true
    void fetchNpmFacts(name).then((live) => {
      if (active && live !== null) setFacts(live)
    })
    return () => {
      active = false
    }
  }, [name])

  return facts
}

export function formatCount(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value)
}
