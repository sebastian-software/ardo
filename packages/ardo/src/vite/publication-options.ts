import fs from "node:fs/promises"
import path from "node:path"
import type { PublicationConfig } from "../publication/types"

export type ViewName = "index" | "post" | "tag"
const views: ViewName[] = ["index", "post", "tag"]

/** Absolute paths of the site's publication modules. */
export type PublicationComponents = Partial<Record<ViewName | "tagLabel", string>>

/** Options of the earlier pull-request revision, with the setting that replaced each. */
const replacedOptions: Record<string, string> = {
  trailingSlash:
    "publication.trailingSlash was replaced by the site-wide trailingSlash option, which also spells sitemap entries, canonical links, and internal links.",
  meta: "publication.meta was replaced by a meta export of the module in publication.components, which Ardo calls when it renders the route.",
}

/** Reject misspelled values early; the options are also used from JavaScript configs. */
export function validatePublicationOptions(options: PublicationConfig): void {
  for (const [name, message] of Object.entries(replacedOptions))
    if (Object.hasOwn(options, name)) throw new Error(`[ardo] ${message}`)
  if (options.tags != null && typeof options.tags !== "boolean")
    throw new Error("[ardo] publication.tags must be a boolean.")
  const feeds = readGroup(options.feeds, "feeds", ["entryIds"])
  if (feeds.entryIds != null && feeds.entryIds !== "post" && feeds.entryIds !== "publication")
    throw new Error('[ardo] publication.feeds.entryIds must be "post" or "publication".')
  const components = readGroup(options.components, "components", views)
  for (const view of views) {
    const component = components[view]
    if (component != null && (typeof component !== "string" || component.trim() === ""))
      throw new Error(`[ardo] publication.components.${view} must be a module path.`)
  }
  if (
    options.tagLabel != null &&
    (typeof options.tagLabel !== "string" || options.tagLabel.trim() === "")
  )
    throw new Error("[ardo] publication.tagLabel must be a module path.")
  if (options.components?.tag != null && options.tags !== true)
    throw new Error(
      "[ardo] publication.components.tag needs tags: true; otherwise no tag archives exist."
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
  const modules: Array<[keyof PublicationComponents, string | undefined, string]> = [
    ...views.map((view): [ViewName, string | undefined, string] => [
      view,
      options.components?.[view],
      `publication.components.${view}`,
    ]),
    ["tagLabel", options.tagLabel, "publication.tagLabel"],
  ]
  for (const [name, module, option] of modules) {
    if (module == null) continue
    const file = path.resolve(root, module)
    if (!(await isFile(file)))
      throw new Error(`[ardo] ${option} must name an existing module: ${file}`)
    resolved[name] = file
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
