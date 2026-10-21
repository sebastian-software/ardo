import type { NativeApiProject } from "../api/native-project"
import type { NativeApiDocsConfig, NativeApiExtraction } from "../api/types"

export type SharedExtraction = {
  /** Plugin instances whose server uses the live compiler; the last one closes it. */
  holders: Set<object>
  project: NativeApiProject | undefined
  result: Promise<NativeApiExtraction>
}

/**
 * React Router evaluates the Vite config for its child compiler and the
 * prerender server as well, and every evaluation creates new plugin instances.
 * Only the first instance per project runs the native compiler; later ones
 * reuse its result, and a build stops the compiler as soon as it has one.
 */
const sharedExtractions = new Map<string, SharedExtraction>()

export function getSharedExtraction(config: NativeApiDocsConfig): SharedExtraction | undefined {
  return sharedExtractions.get(extractionKey(config))
}

/** Start the compiler for a project and share its first extraction with later instances. */
export function registerSharedExtraction(
  config: NativeApiDocsConfig,
  holder: object,
  project: NativeApiProject
): SharedExtraction {
  const entry: SharedExtraction = {
    holders: new Set([holder]),
    project,
    result: project.extract(),
  }
  sharedExtractions.set(extractionKey(config), entry)
  return entry
}

export function forgetSharedExtraction(config: NativeApiDocsConfig): void {
  sharedExtractions.delete(extractionKey(config))
}

function extractionKey(config: NativeApiDocsConfig): string {
  return JSON.stringify({ tsconfig: config.tsconfig, entryPoints: config.entryPoints })
}
