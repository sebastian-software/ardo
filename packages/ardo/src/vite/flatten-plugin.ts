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

export function withArdoGitHubPages<TConfig extends Config>(
  config: TConfig,
  options: ArdoGitHubPagesOptions = {}
): Required<Pick<Config, "basename" | "buildEnd">> & TConfig {
  const userBuildEnd = config.buildEnd
  const basename = config.basename ?? options.basename ?? detectGitHubBasename(options.cwd)
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

export function scheduleGitHubPagesBuildOutputFlatten(args: GitHubPagesBuildArgs): void {
  // React Router calls buildEnd before prerendering; the CLI exit event is the first reliable
  // synchronous point after pre-rendered HTML has been written.
  process.once("exit", () => {
    flattenGitHubPagesBuildOutput(args)
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
