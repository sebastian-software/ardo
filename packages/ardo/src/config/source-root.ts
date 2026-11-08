import path from "node:path"

import type { ArdoConfig, ResolvedConfig } from "./types"

/** The configured `sourceRoot` as an absolute path; the key is absent when it is not set. */
export function resolveSourceRoot(
  config: ArdoConfig,
  root: string
): Pick<ResolvedConfig, "sourceRoot"> {
  return config.sourceRoot === undefined
    ? {}
    : { sourceRoot: path.resolve(root, config.sourceRoot) }
}

/** Adds the `validateConfig` error for a `sourceRoot` that JavaScript configs pass untyped. */
export function validateSourceRootConfig(config: ArdoConfig, errors: string[]): void {
  if (
    config.sourceRoot !== undefined &&
    (typeof config.sourceRoot !== "string" || config.sourceRoot.trim() === "")
  )
    errors.push("sourceRoot must be a non-empty directory path.")
}
