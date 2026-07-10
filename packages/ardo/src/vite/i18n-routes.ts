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

  const diagnostics: LocalizedRouteDiagnostic[] = []
  const localeIds = config.i18n.locales.map((locale) => locale.id)
  const localized = new Map<string, Set<string>>()

  for (const entry of manifest) {
    if (entry.sourceLocaleId == null) {
      diagnostics.push({ routePath: entry.routePath, type: "unlocalized" })
      continue
    }

    const routes = localized.get(entry.sourceLocaleId) ?? new Set<string>()
    routes.add(entry.routePath)
    localized.set(entry.sourceLocaleId, routes)
  }

  const routePaths = new Set([...localized.values()].flatMap((routes) => [...routes]))
  for (const routePath of routePaths) {
    for (const localeId of localeIds) {
      if (!localized.get(localeId)?.has(routePath)) {
        diagnostics.push({ localeId, routePath, type: "missing" })
      }
    }
  }

  return diagnostics.sort((left, right) =>
    `${left.routePath}:${left.localeId ?? ""}`.localeCompare(
      `${right.routePath}:${right.localeId ?? ""}`
    )
  )
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
