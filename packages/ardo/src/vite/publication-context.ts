import path from "node:path"
import { resolveImagesConfig } from "../config/images"
import type { ImageSession } from "./image-session"
import type { ResolvedConfig } from "../config/types"
import type { Publication, PublicationConfig } from "../publication/types"
import { isVersionedRoute } from "../config/versioning"
import { ardoImagePresets } from "../images/presets"
import type { ImageAsset } from "./post-images"
import { validatePublicationOptions } from "./publication-options"
import { spellPagePath } from "../runtime/trailing-slash"

export type PublicationInput = {
  options: PublicationConfig
  config: ResolvedConfig
  routesDir: string
  now?: Date
  localeId?: string
  imageSession?: ImageSession
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
  const config = input.config
  const images = resolveImagesConfig(config.images, input.options.images)
  const options = images === undefined ? input.options : { ...input.options, images }
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
  validatePublicationOptions(options)
  const localizedPrefix = input.localeId == null ? prefix : `${input.localeId}/${prefix}`
  const publicRoot = `${config.deploymentBase}${localizedPrefix}/`
  const publication: Publication = {
    imagePresets: { ...ardoImagePresets, ...options.images?.presets },
    name: options.name ?? "News",
    description: options.description,
    path: `/${localizedPrefix}`,
    url: publicationUrl(`/${localizedPrefix}`, input),
    atomUrl: new URL(`${publicRoot}atom.xml`, config.siteUrl).href,
    rssUrl: new URL(`${publicRoot}rss.xml`, config.siteUrl).href,
    posts: [],
  }
  return {
    ...input,
    options,
    prefix,
    localizedPrefix,
    publication,
    sourceDir: path.resolve(config.root, options.from, input.localeId ?? ""),
    assets: input.imageSession?.assets ?? new Map(),
    dependencies: input.imageSession?.dependencies ?? new Set(),
    seenIds: new Set(),
    seenPaths: new Set(),
  }
}

/**
 * Absolute URL of a generated publication page, spelled by the site's `trailingSlash`. Unset, it
 * keeps the publication's earlier slash.
 */
export function publicationUrl(routePath: string, { config }: Pick<PublicationInput, "config">) {
  const pathname = spellPagePath(
    `${config.deploymentBase}${routePath.slice(1)}`,
    config.trailingSlash ?? true,
    config.deploymentBase
  )
  return new URL(pathname, config.siteUrl).href
}

/**
 * The sitemap's absolute URL of a generated page, used as its default canonical link. Unset
 * `trailingSlash` keeps the sitemap's earlier spelling without the slash.
 */
export function canonicalUrl(routePath: string, { config }: Pick<PublicationInput, "config">) {
  const pathname = spellPagePath(
    `${config.deploymentBase}${routePath.slice(1)}`,
    config.trailingSlash,
    config.deploymentBase
  )
  return new URL(pathname, config.siteUrl).href
}

/** Language of the publication's feeds: its locale, or the site language. */
export function publicationLanguage(context: PublicationContext): string {
  return context.localeId ?? context.config.lang
}
