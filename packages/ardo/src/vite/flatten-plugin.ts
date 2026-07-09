import type { Config } from "@react-router/dev/config"

import fs from "node:fs"
import path from "node:path"

import { copyRecursive, detectGitHubBasename } from "./git-utils"

type BuildEnd = NonNullable<Config["buildEnd"]>
type BuildEndArgs = Parameters<BuildEnd>[0]
type GitHubPagesBuildArgs = {
  reactRouterConfig: Pick<BuildEndArgs["reactRouterConfig"], "basename" | "buildDirectory">
  viteConfig: Pick<BuildEndArgs["viteConfig"], "root">
}

export type ArdoGitHubPagesOptions = {
  basename?: string
  cwd?: string
}

export type ArdoVersioningOptions = {
  basename?: string
}

export function withArdoGitHubPages<TConfig extends Config>(
  config: TConfig,
  options: ArdoGitHubPagesOptions = {}
): Required<Pick<Config, "basename" | "buildEnd">> & TConfig {
  const userBuildEnd = config.buildEnd
  const basename = options.basename ?? config.basename ?? detectGitHubBasename(options.cwd)
  const buildEnd: BuildEnd = async (args) => {
    await userBuildEnd?.(args)
    scheduleGitHubPagesBuildOutputFlatten(args)
  }

  return {
    ...config,
    basename,
    buildEnd,
  }
}

export function withArdoVersioning<TConfig extends Config>(
  config: TConfig,
  options: ArdoVersioningOptions = {}
): Required<Pick<Config, "basename">> & TConfig {
  const basename = options.basename ?? config.basename
  if (basename == null) {
    throw new Error("[ardo] withArdoVersioning requires a basename, for example '/v3/'.")
  }

  return {
    ...config,
    basename,
  }
}

export function scheduleGitHubPagesBuildOutputFlatten(args: GitHubPagesBuildArgs): void {
  // React Router calls buildEnd before prerendering; the CLI exit event is the first reliable
  // synchronous point after pre-rendered HTML has been written.
  process.once("exit", () => {
    try {
      flattenGitHubPagesBuildOutput(args)
    } catch (error) {
      process.exitCode = 1
      console.error("[ardo] Failed to flatten GitHub Pages build output.")
      console.error(error)
    }
  })
}

export function flattenGitHubPagesBuildOutput(args: GitHubPagesBuildArgs): void {
  const baseName = trimSlashes(args.reactRouterConfig.basename)
  if (baseName === "") {
    return
  }

  const buildDir = path.resolve(
    args.viteConfig.root,
    args.reactRouterConfig.buildDirectory,
    "client"
  )
  const nestedDir = path.join(buildDir, baseName)
  if (!fs.existsSync(nestedDir)) {
    return
  }

  console.log(`[ardo] Flattening ${path.relative(process.cwd(), nestedDir)} for GitHub Pages`)
  copyRecursive(nestedDir, buildDir)
  fs.rmSync(nestedDir, { recursive: true, force: true })
  console.log("[ardo] Build output flattened successfully.")
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
