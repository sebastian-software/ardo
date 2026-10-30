import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { getCurrentVersion } from "../config/versioning"
import { buildPublicPath } from "./route-identity"
import type { RouteManifestEntry } from "./route-manifest"

export function createVersioningBuildOutputAssets(config: ResolvedConfig) {
  if (config.versioning === false) {
    return []
  }

  return [{ fileName: "versions.json", source: generateVersionsJson(config) }]
}

export function generateVersionsJson(config: ResolvedConfig) {
  if (config.versioning === false) {
    return ""
  }

  return `${JSON.stringify(
    {
      current: config.versioning.current,
      versions: config.versioning.versions.map((version) => ({
        id: version.id,
        label: version.label ?? version.id,
        path: version.path,
        ...(version.locales == null ? {} : { locales: version.locales }),
      })),
    },
    null,
    2
  )}\n`
}

export function getRootVersionRedirect(
  config: ResolvedConfig
): { from: string; to: string } | null {
  if (
    config.versioning === false ||
    config.versioning.directories != null ||
    config.versioning.rootRedirect === false
  ) {
    return null
  }

  const currentVersion = getCurrentVersion(config.versioning)
  if (currentVersion == null || currentVersion.path === "/") {
    return null
  }

  return {
    from: "/",
    to: buildPublicPath({
      basePath: currentVersion.path,
      localeId: getDefaultLocaleId(config.i18n),
      routePath: "/",
    }),
  }
}

export function getVersioningRedirects(
  config: ResolvedConfig,
  entries: RouteManifestEntry[] = []
): Array<{ from: string; to: string }> {
  const siteLocale =
    config.i18n !== false && config.versioning !== false && config.versioning.directories != null
      ? {
          from: "/",
          to: buildPublicPath({
            basePath: config.deploymentBase,
            localeId: config.i18n.defaultLocale,
            routePath: "/",
          }),
        }
      : null
  return [
    getRootVersionRedirect(config),
    getVersionRootLocaleRedirect(config),
    siteLocale,
    ...getDocumentationRootRedirects(config, entries),
  ].filter((redirect): redirect is { from: string; to: string } => redirect != null)
}

/** A version root enters its documentation, rather than a historical marketing home. */
function getDocumentationRootRedirects(
  config: ResolvedConfig,
  entries: RouteManifestEntry[]
): Array<{ from: string; to: string }> {
  if (config.versioning === false || config.versioning.directories == null || entries.length === 0)
    return []
  const directories = config.versioning.directories
  const versioning = config.versioning
  const version = getCurrentVersion(versioning)
  if (version == null || version.path === config.deploymentBase) return []
  const defaultLocale = getDefaultLocaleId(config.i18n)
  const locales: Array<string | undefined> =
    config.i18n === false ? [undefined] : config.i18n.locales.map((locale) => locale.id)
  const redirects = locales.map((localeId) => {
    const candidates = entries.filter(
      (entry) =>
        entry.identity.versionId === versioning.current && entry.identity.localeId === localeId
    )
    candidates.sort((a, b) => compareDocEntries(a, b, directories))
    const first = candidates[0]
    const to =
      first == null
        ? buildPublicPath({ basePath: config.deploymentBase, localeId, routePath: "/" })
        : `${first.publicPath.replace(/\/$/u, "")}/`
    return { from: buildPublicPath({ basePath: version.path, localeId, routePath: "/" }), to }
  })
  if (config.i18n !== false)
    redirects.push({ from: version.path, to: redirects[locales.indexOf(defaultLocale)].to })
  return redirects
}

function compareDocEntries(
  a: RouteManifestEntry,
  b: RouteManifestEntry,
  directories: string[]
): number {
  const rankA = directories.findIndex(
    (directory) => a.routePath === `/${directory}` || a.routePath.startsWith(`/${directory}/`)
  )
  const rankB = directories.findIndex(
    (directory) => b.routePath === `/${directory}` || b.routePath.startsWith(`/${directory}/`)
  )
  return (
    rankA - rankB ||
    a.routePath.split("/").length - b.routePath.split("/").length ||
    (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity) ||
    a.routePath.localeCompare(b.routePath)
  )
}

export function getVersionRootLocaleRedirect(
  config: ResolvedConfig
): { from: string; to: string } | null {
  if (
    config.i18n === false ||
    (config.versioning !== false &&
      (config.versioning.directories != null || config.versioning.rootRedirect === false))
  )
    return null
  const currentVersion =
    config.versioning === false ? undefined : getCurrentVersion(config.versioning)
  const basePath = currentVersion?.path ?? config.base
  return {
    from: basePath,
    to: buildPublicPath({ basePath, localeId: config.i18n.defaultLocale, routePath: "/" }),
  }
}
