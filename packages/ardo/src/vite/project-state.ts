import type { Plugin } from "vite"

import type { ResolvedConfig } from "../config/types"

/** Project facts that the main Ardo plugin resolves while Vite resolves the project config. */
export type ArdoProjectState = {
  resolvedConfig: ResolvedConfig
  routesDir: string
}

/**
 * A global symbol rather than a module-level registry: Vite can load a project's config with its
 * own copy of the plugin modules, so the reader must be found on the plugin object itself.
 */
const projectStateReader = Symbol.for("ardo.projectStateReader")

/** Attach the reader the main plugin uses to expose its resolved state. */
export function defineProjectStateReader(
  plugin: Plugin,
  read: () => ArdoProjectState | undefined
): void {
  Object.defineProperty(plugin, projectStateReader, { value: read })
}

/**
 * Read the state of the main Ardo plugin from a resolved Vite config, so commands that never
 * build (`ardo check`, `ardo lint`) use the same routes directory and site config as the build.
 */
export function readArdoProjectState(plugins: readonly Plugin[]): ArdoProjectState | undefined {
  for (const plugin of plugins) {
    const reader: unknown = Reflect.get(plugin, projectStateReader)
    if (typeof reader !== "function") continue
    const state: unknown = reader()
    if (isArdoProjectState(state)) return state
  }
  return undefined
}

function isArdoProjectState(value: unknown): value is ArdoProjectState {
  return typeof value === "object" && value !== null && "resolvedConfig" in value
}
