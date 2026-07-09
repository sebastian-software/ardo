import type { ArdoConfig } from "../config/types"

import {
  joinUrlPath,
  normalizeBasePath,
  resolveVersionedBase,
  resolveVersioningConfig,
} from "../config/versioning"
import { normalizeViteBaseForArdo } from "./base"
import { detectGitHubRepoName, getGitHubPagesBase } from "./git-utils"

export type VersionedMainBaseInput = {
  command: string
  githubPages: boolean
  pressConfig: Pick<ArdoConfig, "base" | "i18n" | "versioning">
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
  const githubPagesBase = resolveGitHubPagesBase(input)
  const deploymentBase = resolveDeploymentBase(input, githubPagesBase)
  const versionBase = resolveViteVersionedBase(
    input.pressConfig.i18n,
    input.pressConfig.versioning,
    deploymentBase
  )
  const viteBase = versionBase ?? input.pressConfig.base ?? githubPagesBase

  if (githubPagesBase != null) {
    logMessages.push(`[ardo] GitHub Pages detected, using base: ${githubPagesBase}`)
  }
  if (versionBase != null) {
    logMessages.push(`[ardo] Documentation versioning enabled, using base: ${versionBase}`)
  }

  return { deploymentBase, logMessages, viteBase }
}

function resolveGitHubPagesBase(input: VersionedMainBaseInput): string | undefined {
  if (!input.githubPages || input.command !== "build" || input.userBase != null) {
    return undefined
  }

  const repoName = detectGitHubRepoName(input.root)
  return repoName == null ? undefined : getGitHubPagesBase(repoName)
}

function resolveDeploymentBase(
  input: VersionedMainBaseInput,
  githubPagesBase: string | undefined
): string {
  const configuredBase = input.pressConfig.base ?? githubPagesBase
  if (configuredBase != null) {
    return normalizeBasePath(configuredBase)
  }

  const userBase = normalizeViteBaseForArdo(input.userBase ?? "/")
  const versioning = input.pressConfig.versioning
  if (input.userBase == null || versioning == null || versioning === false) {
    return normalizeBasePath(userBase)
  }

  const currentVersion = versioning.versions.find((version) => version.id === versioning.current)
  return currentVersion == null
    ? normalizeBasePath(userBase)
    : stripVersionPath(userBase, currentVersion.path)
}

function resolveViteVersionedBase(
  i18n: ArdoConfig["i18n"],
  versioning: ArdoConfig["versioning"],
  deploymentBase: string
): string | undefined {
  const resolvedVersioning = resolveVersioningConfig(versioning, deploymentBase)
  if (resolvedVersioning === false) {
    return undefined
  }

  const versionedBase = resolveVersionedBase(deploymentBase, resolvedVersioning)
  return i18n === false || i18n == null
    ? versionedBase
    : joinUrlPath(versionedBase, i18n.defaultLocale)
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
