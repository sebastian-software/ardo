import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { getCurrentVersion } from "../config/versioning"
import { buildPublicPath } from "./route-identity"

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
      })),
    },
    null,
    2
  )}\n`
}

export function getRootVersionRedirect(
  config: ResolvedConfig
): { from: string; to: string } | null {
  if (config.versioning === false || config.versioning.rootRedirect === false) {
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
  config: ResolvedConfig
): Array<{ from: string; to: string }> {
  return [getRootVersionRedirect(config), getVersionRootLocaleRedirect(config)].filter(
    (redirect): redirect is { from: string; to: string } => redirect != null
  )
}

export function getVersionRootLocaleRedirect(
  config: ResolvedConfig
): { from: string; to: string } | null {
  if (
    config.versioning === false ||
    config.versioning.rootRedirect === false ||
    config.i18n === false
  ) {
    return null
  }

  const currentVersion = getCurrentVersion(config.versioning)
  if (currentVersion == null) {
    return null
  }

  return {
    from: currentVersion.path,
    to: buildPublicPath({
      basePath: currentVersion.path,
      localeId: config.i18n.defaultLocale,
      routePath: "/",
    }),
  }
}
