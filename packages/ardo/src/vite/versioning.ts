import type { ArdoConfig } from "../config/types"

import {
  normalizeBasePath,
  resolveVersionedBase,
  resolveVersioningConfig,
} from "../config/versioning"
import { normalizeViteBaseForArdo } from "./base"
import { detectGitHubRepoName, getGitHubPagesBase } from "./git-utils"

export type VersionedMainBaseInput = {
  command: string
  githubPages: boolean
  pressConfig: Pick<ArdoConfig, "base" | "versioning">
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
  const deploymentBase = normalizeBasePath(
    input.pressConfig.base ?? githubPagesBase ?? normalizeViteBaseForArdo(input.userBase ?? "/")
  )
  const versionBase = resolveViteVersionedBase(input.pressConfig.versioning, deploymentBase)
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
