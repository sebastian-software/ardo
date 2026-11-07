import fs from "node:fs/promises"
import path from "node:path"
import type { PublicationConfig } from "../publication/types"

export type ViewName = "index" | "post" | "tag"
const views: ViewName[] = ["index", "post", "tag"]

export type PublicationComponents = Partial<Record<ViewName, string>>

/** Reject misspelled values early; the options are also used from JavaScript configs. */
export function validatePublicationOptions(options: PublicationConfig): void {
  for (const name of ["trailingSlash", "tags"] as const)
    if (options[name] != null && typeof options[name] !== "boolean")
      throw new Error(`[ardo] publication.${name} must be a boolean.`)
  const feeds = readGroup(options.feeds, "feeds", ["entryIds"])
  if (feeds.entryIds != null && feeds.entryIds !== "post" && feeds.entryIds !== "publication")
    throw new Error('[ardo] publication.feeds.entryIds must be "post" or "publication".')
  const components = readGroup(options.components, "components", views)
  const meta = readGroup(options.meta, "meta", views)
  for (const view of views) {
    const component = components[view]
    if (component != null && (typeof component !== "string" || component.trim() === ""))
      throw new Error(`[ardo] publication.components.${view} must be a module path.`)
    if (meta[view] != null && typeof meta[view] !== "function")
      throw new Error(`[ardo] publication.meta.${view} must be a function.`)
  }
  for (const group of ["components", "meta"] as const)
    if (options[group]?.tag != null && options.tags !== true)
      throw new Error(
        `[ardo] publication.${group}.tag needs tags: true; otherwise no tag archives exist.`
      )
}

/** An optional option group: a plain object with only the known keys. */
function readGroup(value: unknown, name: string, keys: readonly string[]): Record<string, unknown> {
  if (value == null) return {}
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error(`[ardo] publication.${name} must be an object.`)
  const unknown = Object.keys(value).find((key) => !keys.includes(key))
  if (unknown != null)
    throw new Error(
      `[ardo] Unknown option publication.${name}.${unknown}. Supported: ${keys.join(", ")}.`
    )
  return value as Record<string, unknown>
}

/** Absolute paths of the configured site components, which must exist. */
export async function resolvePublicationComponents(
  options: PublicationConfig,
  root: string
): Promise<PublicationComponents> {
  const resolved: PublicationComponents = {}
  for (const view of views) {
    const component = options.components?.[view]
    if (component == null) continue
    const file = path.resolve(root, component)
    if (!(await isFile(file)))
      throw new Error(`[ardo] publication.components.${view} must name an existing module: ${file}`)
    resolved[view] = file
  }
  return resolved
}

async function isFile(file: string): Promise<boolean> {
  try {
    const stat = await fs.stat(file)
    return stat.isFile()
  } catch {
    return false
  }
}

/** Relative import specifier for a module, as seen from a generated route file. */
export function importPath(fromFile: string, target: string): string {
  const relative = path.relative(path.dirname(fromFile), target).split(path.sep).join("/")
  return relative.startsWith(".") ? relative : `./${relative}`
}
