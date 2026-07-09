import type { ResolvedConfig } from "../config/types"

import { getCurrentVersion } from "../config/versioning"

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

  return { from: "/", to: currentVersion.path }
}
