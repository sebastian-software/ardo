import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

export type LocalizedRouteDiagnostic = {
  localeId?: string
  routePath: string
  type: "missing" | "unlocalized"
}

/**
 * I18n is deliberately static: every visible route must live under a locale
 * directory and every locale must provide that same route. This keeps links,
 * sidebars, search, and deployed output deterministic without runtime
 * fallback rules.
 */
export function findLocalizedRouteDiagnostics(
  manifest: Array<Pick<RouteManifestEntry, "routePath" | "sourceLocaleId">>,
  config: Pick<ResolvedConfig, "i18n">
): LocalizedRouteDiagnostic[] {
  if (config.i18n === false) return []

  const localeIds = config.i18n.locales.map((locale) => locale.id)
  const { diagnostics, localized } = collectLocalizedRoutes(manifest)
  diagnostics.push(...findMissingLocalizedRoutes(localized, localeIds))

  return diagnostics.sort((left, right) =>
    `${left.routePath}:${left.localeId ?? ""}`.localeCompare(
      `${right.routePath}:${right.localeId ?? ""}`
    )
  )
}

function collectLocalizedRoutes(
  manifest: Array<Pick<RouteManifestEntry, "routePath" | "sourceLocaleId">>
): { diagnostics: LocalizedRouteDiagnostic[]; localized: Map<string, Set<string>> } {
  const diagnostics: LocalizedRouteDiagnostic[] = []
  const localized = new Map<string, Set<string>>()
  for (const entry of manifest) {
    if (entry.sourceLocaleId == null) {
      diagnostics.push({ routePath: entry.routePath, type: "unlocalized" })
    } else {
      const routes = localized.get(entry.sourceLocaleId) ?? new Set<string>()
      routes.add(entry.routePath)
      localized.set(entry.sourceLocaleId, routes)
    }
  }
  return { diagnostics, localized }
}

function findMissingLocalizedRoutes(
  localized: Map<string, Set<string>>,
  localeIds: string[]
): LocalizedRouteDiagnostic[] {
  const diagnostics: LocalizedRouteDiagnostic[] = []
  const routePaths = new Set([...localized.values()].flatMap((routes) => [...routes]))
  for (const routePath of routePaths) {
    for (const localeId of localeIds) {
      if (!localized.get(localeId)?.has(routePath)) {
        diagnostics.push({ localeId, routePath, type: "missing" })
      }
    }
  }
  return diagnostics
}

export function formatLocalizedRouteDiagnostics(diagnostics: LocalizedRouteDiagnostic[]): string {
  return diagnostics
    .map((diagnostic) =>
      diagnostic.type === "unlocalized"
        ? `- ${diagnostic.routePath}: move this route under app/routes/<locale>/`
        : `- ${diagnostic.routePath}: missing ${diagnostic.localeId} translation`
    )
    .join("\n")
}

export function reportLocalizedRouteDiagnostics(
  context: { error: (message: string) => never },
  manifest: Array<Pick<RouteManifestEntry, "routePath" | "sourceLocaleId">>,
  config: Pick<ResolvedConfig, "i18n">
) {
  const diagnostics = findLocalizedRouteDiagnostics(manifest, config)
  if (diagnostics.length === 0) return

  context.error(
    `[ardo] i18n requires a complete static route tree for every configured locale:\n${formatLocalizedRouteDiagnostics(diagnostics)}`
  )
}
