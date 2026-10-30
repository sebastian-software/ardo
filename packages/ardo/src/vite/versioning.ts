import type { ArdoConfig } from "../config/types"

import {
  normalizeBasePath,
  resolveVersionedBase,
  resolveVersioningConfig,
} from "../config/versioning"
import { normalizeViteBaseForArdo } from "./base"

export type VersionedMainBaseInput = {
  command: string
  siteConfig: Pick<ArdoConfig, "base" | "i18n" | "versioning">
  root: string
  userBase: string | undefined
}

export type VersionedMainBaseResult = {
  deploymentBase: string
  logMessages: string[]
  viteBase?: string
}

export function resolveVersionedMainBase(input: VersionedMainBaseInput): VersionedMainBaseResult {
  const logMessages: string[] = []
  const deploymentBase = resolveDeploymentBase(input)
  const versionBase = resolveViteVersionedBase(input.siteConfig.versioning, deploymentBase)
  const viteBase = versionBase ?? input.siteConfig.base

  if (versionBase != null) {
    logMessages.push(`[ardo] Documentation versioning enabled, using base: ${versionBase}`)
  }

  return { deploymentBase, logMessages, viteBase }
}

export function resolveVersionedPreviewBase(input: {
  deploymentBase: string
  versioning: ArdoConfig["versioning"]
  userBase: string | undefined
  viteBase: unknown
}): string | undefined {
  if (
    input.versioning == null ||
    input.versioning === false ||
    input.userBase != null ||
    typeof input.viteBase === "string"
  ) {
    return undefined
  }
  return input.deploymentBase
}

function resolveDeploymentBase(input: VersionedMainBaseInput): string {
  const configuredBase = input.siteConfig.base
  if (configuredBase != null) {
    return normalizeBasePath(configuredBase)
  }

  const userBase = normalizeViteBaseForArdo(input.userBase ?? "/")
  const versioning = input.siteConfig.versioning
  if (input.userBase == null || versioning == null || versioning === false) {
    return normalizeBasePath(userBase)
  }
  if (versioning.directories != null) return normalizeBasePath(userBase)

  const currentVersion = versioning.versions.find((version) => version.id === versioning.current)
  return currentVersion == null
    ? normalizeBasePath(userBase)
    : stripVersionPath(userBase, currentVersion.path)
}

function resolveViteVersionedBase(
  versioning: ArdoConfig["versioning"],
  deploymentBase: string
): string | undefined {
  const resolvedVersioning = resolveVersioningConfig(versioning, deploymentBase)
  if (resolvedVersioning === false) {
    return undefined
  }

  return resolveVersionedBase(deploymentBase, resolvedVersioning)
}

function stripVersionPath(base: string, versionPath: string): string {
  const normalizedBase = normalizeBasePath(base)
  const normalizedVersion = normalizeBasePath(versionPath)
  if (normalizedVersion === "/") {
    return normalizedBase
  }

  const baseWithoutTrailingSlash = normalizedBase.replace(/\/$/u, "")
  const versionSuffix = `/${trimSlashes(normalizedVersion)}`
  if (baseWithoutTrailingSlash === versionSuffix) {
    return "/"
  }

  if (baseWithoutTrailingSlash.endsWith(versionSuffix)) {
    return normalizeBasePath(baseWithoutTrailingSlash.slice(0, -versionSuffix.length) || "/")
  }

  return normalizedBase
}

function trimSlashes(value: string): string {
  let trimmed = value
  while (trimmed.startsWith("/")) {
    trimmed = trimmed.slice(1)
  }
  while (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1)
  }
  return trimmed
}
