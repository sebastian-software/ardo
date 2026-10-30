import path from "node:path"
import type { ResolvedConfig } from "../config/types"
import type { Publication, PublicationConfig } from "../publication/types"
import { isVersionedRoute } from "../config/versioning"
import { ardoImagePresets } from "../publication/presets"
import type { ImageAsset } from "./post-images"

export type PublicationInput = {
  options: PublicationConfig
  config: ResolvedConfig
  routesDir: string
  now?: Date
  localeId?: string
}
export type PublicationContext = PublicationInput & {
  prefix: string
  sourceDir: string
  localizedPrefix: string
  publication: Publication
  assets: Map<string, ImageAsset>
  dependencies: Set<string>
  seenIds: Set<string>
  seenPaths: Set<string>
}

export function createPublicationContext(input: PublicationInput): PublicationContext {
  const { options, config } = input
  if (!config.siteUrl)
    throw new Error("[ardo] publication requires siteUrl for stable article and feed URLs.")
  if (typeof options.from !== "string" || options.from.trim() === "")
    throw new Error("[ardo] publication.from must identify a local posts directory.")
  const prefix = options.to ?? "news"
  if (!/^[\w-]+(?:\/[\w-]+)*$/u.test(prefix))
    throw new Error("[ardo] publication.to must be a route directory such as news or company/news.")
  if (isVersionedRoute(`/${prefix}`, config.versioning))
    throw new Error(
      "[ardo] Publication routes must be unversioned. Configure versioning.directories for documentation folders and leave the publication directory outside them."
    )
  const localizedPrefix = input.localeId == null ? prefix : `${input.localeId}/${prefix}`
  const publicRoot = `${config.deploymentBase}${localizedPrefix}/`
  const publication: Publication = {
    imagePresets: { ...ardoImagePresets, ...options.images?.presets },
    name: options.name ?? "News",
    description: options.description,
    path: `/${localizedPrefix}`,
    url: new URL(publicRoot, config.siteUrl).href,
    atomUrl: new URL(`${publicRoot}atom.xml`, config.siteUrl).href,
    rssUrl: new URL(`${publicRoot}rss.xml`, config.siteUrl).href,
    posts: [],
  }
  return {
    ...input,
    prefix,
    localizedPrefix,
    publication,
    sourceDir: path.resolve(config.root, options.from, input.localeId ?? ""),
    assets: new Map(),
    dependencies: new Set(),
    seenIds: new Set(),
    seenPaths: new Set(),
  }
}
