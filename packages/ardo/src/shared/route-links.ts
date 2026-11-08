import type { DocumentationVersioningConfig, I18nConfig } from "../config/types"

import { createSourceRouteIdentity } from "./route-identity"

/**
 * The site config fields that decide public route addresses. The build passes its resolved
 * config; the browser passes `virtual:ardo/config`, which carries the same values.
 */
export type RouteLinkConfig = {
  base?: string
  deploymentBase?: string
  i18n?: false | I18nConfig
  versioning?: DocumentationVersioningConfig | false
}

/** Link data both render sides derive from the logical paths of every route. */
export type RouteLinks = {
  /** Every logical path, so links can tell dotted pages from static files. */
  paths: ReadonlySet<string>
  /** Public address per logical path; empty without directory-based versioning. */
  publicPaths: ReadonlyMap<string, string>
}

/**
 * Public address of an authored route when the site versions selected directories, for example
 * `/v6/de/guide/intro` for `/de/guide/intro`. Without directory-based versioning, routes are
 * mounted at their authored path and have no separate public address.
 */
export function resolveRoutePublicPath(
  routePath: string,
  config: RouteLinkConfig | undefined
): string | undefined {
  const versioning = config?.versioning
  if (versioning == null || versioning === false || versioning.directories == null) return
  return createSourceRouteIdentity(routePath, {
    base: config?.base ?? "/",
    deploymentBase: config?.deploymentBase,
    i18n: config?.i18n ?? false,
    versioning,
  }).publicPath
}

const cache = new WeakMap<
  readonly string[],
  { config: RouteLinkConfig | undefined; links: RouteLinks }
>()

/**
 * Derive the link data for a site's logical paths. The result is cached per paths array and
 * config, so prerendering many pages derives every public address only once.
 */
export function getRouteLinks(
  paths: readonly string[],
  config: RouteLinkConfig | undefined
): RouteLinks {
  const cached = cache.get(paths)
  if (cached != null && cached.config === config) return cached.links
  const publicPaths = new Map<string, string>()
  for (const routePath of paths) {
    const publicPath = resolveRoutePublicPath(routePath, config)
    if (publicPath != null) publicPaths.set(routePath, publicPath)
  }
  const links = { paths: new Set(paths), publicPaths }
  cache.set(paths, { config, links })
  return links
}

/**
 * Public address per link target for one page. Besides every logical path, a localized site
 * also maps the paths of the page's locale without their locale prefix, so `/guide/intro` on a
 * German page reaches the German guide.
 */
export function createRouteHrefs(
  paths: readonly string[],
  config: RouteLinkConfig | undefined,
  pagePath: string
): ReadonlyMap<string, string> {
  const { publicPaths } = getRouteLinks(paths, config)
  const result = new Map(publicPaths)
  const i18n = config?.i18n
  if (i18n != null && i18n !== false && result.size > 0) {
    const locale =
      i18n.locales.find((entry) => pagePath.split("/")[1] === entry.id)?.id ?? i18n.defaultLocale
    for (const [logical, publicPath] of publicPaths) {
      if (logical === `/${locale}` || logical.startsWith(`/${locale}/`))
        result.set(logical.slice(locale.length + 1) || "/", publicPath)
    }
  }
  return result
}
