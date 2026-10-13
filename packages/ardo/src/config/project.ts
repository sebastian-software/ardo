import type { ConfigEnv } from "vite"

import type { ArdoPluginOptions } from "../vite/plugin-options"

export type ArdoProjectConfigExport =
  | ((environment: ConfigEnv) => ArdoPluginOptions | Promise<ArdoPluginOptions>)
  | ArdoPluginOptions
  | Promise<ArdoPluginOptions>

/** Identity helper that preserves type checking for ardo.config exports. */
export function defineArdoConfig<T extends ArdoProjectConfigExport>(config: T): T {
  return config
}
