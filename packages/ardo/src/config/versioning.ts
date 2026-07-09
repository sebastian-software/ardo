import type { DocumentationVersioningConfig } from "./types"

export function resolveVersioningConfig(
  versioning: DocumentationVersioningConfig | false | undefined,
  deploymentBase: string
): DocumentationVersioningConfig | false {
  if (versioning == null || versioning === false) {
    return false
  }

  return {
    current: versioning.current,
    rootRedirect: versioning.rootRedirect ?? true,
    versions: versioning.versions.map((version) => ({
      ...version,
      label: version.label ?? version.id,
      path: joinUrlPath(deploymentBase, version.path),
    })),
  }
}

export function resolveVersionedBase(
  deploymentBase: string,
  versioning: DocumentationVersioningConfig | false
): string {
  if (versioning === false) {
    return normalizeBasePath(deploymentBase)
  }

  return getCurrentVersion(versioning)?.path ?? normalizeBasePath(deploymentBase)
}

export function getCurrentVersion(versioning: DocumentationVersioningConfig) {
  return versioning.versions.find((version) => version.id === versioning.current)
}

export function joinUrlPath(basePath: string, routePath: string) {
  const normalizedBase = normalizeBasePath(basePath)
  const normalizedRoute = normalizeBasePath(routePath)

  if (normalizedBase === "/") {
    return normalizedRoute
  }

  if (normalizedRoute === "/") {
    return normalizedBase
  }

  return `/${[trimSlashes(normalizedBase), trimSlashes(normalizedRoute)].filter(Boolean).join("/")}/`
}

export function normalizeBasePath(value: string) {
  const trimmed = value.trim()
  if (trimmed === "" || trimmed === "/") {
    return "/"
  }

  return `/${trimSlashes(trimmed)}/`
}

function trimSlashes(value: string) {
  let trimmed = value

  while (trimmed.startsWith("/")) {
    trimmed = trimmed.slice(1)
  }

  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1)
  }

  return trimmed
}
