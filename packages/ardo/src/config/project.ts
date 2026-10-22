import type { ConfigEnv } from "vite"

import type { ArdoPluginOptions } from "../vite/plugin-options"

export type ArdoProjectConfigExport =
  | ((environment: ConfigEnv) => ArdoPluginOptions | Promise<ArdoPluginOptions>)
  | ArdoPluginOptions
  | Promise<ArdoPluginOptions>

/** Contextually type configuration literals, including nested options. */
export function defineArdoConfig(config: ArdoPluginOptions): ArdoPluginOptions
export function defineArdoConfig(config: Promise<ArdoPluginOptions>): Promise<ArdoPluginOptions>
export function defineArdoConfig(
  config: (environment: ConfigEnv) => ArdoPluginOptions | Promise<ArdoPluginOptions>
): (environment: ConfigEnv) => ArdoPluginOptions | Promise<ArdoPluginOptions>
export function defineArdoConfig(config: ArdoProjectConfigExport): ArdoProjectConfigExport
export function defineArdoConfig(config: ArdoProjectConfigExport): ArdoProjectConfigExport {
  return config
}
