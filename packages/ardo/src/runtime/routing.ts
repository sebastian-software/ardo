import type { ComponentType, ReactNode } from "react"

import type { ArdoMetaDescriptor, ArdoPage, ArdoPageError } from "./page-context"

import { ArdoErrorBoundary } from "../ui/ErrorBoundary"

/** Exports Ardo reads from a route module. */
export type ArdoRouteModule = {
  default?: ComponentType
  /** A Markdown route's frontmatter, which Ardo's compiler exports. */
  frontmatter?: Record<string, unknown>
  handle?: unknown
  meta?: () => ArdoMetaDescriptor[]
}

/** Exports Ardo reads from `app/root.tsx`. */
export type ArdoRootModule = ArdoRouteModule & {
  ErrorBoundary?: ComponentType
  Layout?: ComponentType<{ children: ReactNode }>
}

export type ArdoRouteEntry = {
  /** Authored path when the public URL includes a documentation version. */
  logicalPath?: string
  publicPath?: string
  /** Route file relative to the project root, for example `app/routes/guide/intro.mdx`. */
  id: string
  /** URL path without the base path, for example `/guide/intro`. Segments may be `:param`. */
  path: string
  source?: ArdoPage["source"]
  load: () => Promise<ArdoRouteModule>
}

/** The parts of a route that rendering a page needs. The client knows only these. */
export type ArdoPageRoute = Pick<ArdoRouteEntry, "id" | "load"> &
  Partial<Pick<ArdoRouteEntry, "logicalPath" | "source">>

/** Lazy page module imports keyed by route id, from `virtual:ardo/page-loaders`. */
export type ArdoPageLoaders = Record<string, () => Promise<ArdoRouteModule>>

/** Serializable description of a rendered page, shared by server and client. */
export type ArdoPageData = {
  base: string
  error?: { status: number; message?: string }
  /** URL of the page's own module chunk in a build, the same URL as its `modulepreload`. */
  module?: string
  path: string
  routeId?: string
  source?: ArdoPage["source"]
}

export type ArdoResolvedPage = {
  component: ComponentType
  data: ArdoPageData
  error?: ArdoPageError
  frontmatter?: ArdoPage["frontmatter"]
  handle?: unknown
  source?: ArdoPage["source"]
  meta: ArdoMetaDescriptor[]
}

/** Find the route for a path. Static paths win over paths with parameters. */
export function matchRoute(routes: ArdoRouteEntry[], pathname: string): ArdoRouteEntry | undefined {
  const target = trimTrailingSlash(pathname)
  const exact = routes.find((route) => trimTrailingSlash(route.path) === target)
  if (exact != null) return exact
  return routes.find((route) => route.path.includes(":") && matchesPattern(route.path, target))
}

/** Whether a route has parameters and therefore no single page to prerender. */
export function isDynamicRoute(route: ArdoRouteEntry): boolean {
  return route.path.includes(":")
}

/** Load the module behind a page and decide what to render. */
export async function resolvePage(input: {
  base: string
  path: string
  root: ArdoRootModule
  route: ArdoPageRoute | undefined
  error?: ArdoPageData["error"]
  source?: ArdoPage["source"]
  /** `<title>` for pages whose module and root set none, usually the site title. */
  siteTitle?: string
}): Promise<ArdoResolvedPage> {
  const { base, path, root, route } = input
  if (input.error == null && route != null) {
    const module = await route.load()
    if (module.default == null) {
      throw new Error(`[ardo] Route "${route.id}" must export a default page component.`)
    }
    return {
      component: module.default,
      data: {
        base,
        path: route.logicalPath ?? path,
        routeId: route.id,
        source: input.source ?? route.source,
      },
      handle: module.handle,
      ...(isRecord(module.frontmatter) ? { frontmatter: module.frontmatter } : {}),
      source: input.source ?? route.source,
      meta: withDefaultTitle((module.meta ?? root.meta)?.() ?? [], input.siteTitle),
    }
  }
  const error = input.error ?? { status: 404, message: `No page at ${path}` }
  return {
    component: root.ErrorBoundary ?? ArdoErrorBoundary,
    data: { base, error, path },
    error,
    meta: withDefaultTitle(root.meta?.() ?? [], input.siteTitle),
  }
}

/**
 * Load the module of the page the server rendered. A build names the page's
 * own chunk, which the document already preloads, so the page loads in one
 * request. Without that URL, as in development, the loader table is imported
 * and the page loads through it.
 */
export async function loadPageModule(
  page: { module?: unknown; routeId: string },
  options: {
    /** URL the module URL resolves against, like the `modulepreload` link: `document.baseURI`. */
    baseURI: string
    /** Receives `vite:preloadError` when the page chunk fails to load: the window, `globalThis`. */
    events: EventTarget
    importModule: (url: string) => Promise<ArdoRouteModule>
    importLoaders: () => Promise<ArdoPageLoaders>
  }
): Promise<ArdoRouteModule> {
  if (typeof page.module === "string" && page.module !== "") {
    const url = new URL(page.module, options.baseURI).href
    try {
      return await options.importModule(url)
    } catch (error) {
      return reportPreloadError(error, options.events)
    }
  }
  const loaders = await options.importLoaders()
  const load = Object.hasOwn(loaders, page.routeId) ? loaders[page.routeId] : undefined
  if (load == null) {
    throw new Error(`[ardo] The client has no page module for route "${page.routeId}".`)
  }
  return load()
}

/**
 * Report a failed page chunk import the way Vite's preload helper reports the
 * dynamic imports it wraps, which the direct import of the page URL bypasses: a
 * cancelable `vite:preloadError` event whose `payload` is the error. A site can
 * prevent it to recover from a deployment that replaced the chunk, usually by
 * reloading the page. Then hydration stops and waits for that; otherwise the
 * error is rethrown.
 */
async function reportPreloadError(error: unknown, events: EventTarget): Promise<never> {
  const event = Object.assign(new Event("vite:preloadError", { cancelable: true }), {
    payload: error,
  })
  events.dispatchEvent(event)
  if (!event.defaultPrevented) throw error
  return new Promise<never>(() => {
    // The listener took over; the page never renders from this import.
  })
}

/** Every page gets a `<title>`: the site title unless the page or root set one. */
function withDefaultTitle(
  meta: ArdoMetaDescriptor[],
  siteTitle: string | undefined
): ArdoMetaDescriptor[] {
  if (siteTitle == null || siteTitle === "") return meta
  if (meta.some((descriptor) => "title" in descriptor && !("tagName" in descriptor))) return meta
  return [...meta, { title: siteTitle }]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function matchesPattern(pattern: string, pathname: string): boolean {
  const patternSegments = trimTrailingSlash(pattern).split("/")
  const pathSegments = pathname.split("/")
  if (patternSegments.length !== pathSegments.length) return false
  return patternSegments.every(
    (segment, index) => segment.startsWith(":") || segment === pathSegments[index]
  )
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname
}

/** Element that holds the hydrated part of every page. */
export const ARDO_APP_ELEMENT_ID = "ardo-app"
/** Attribute on that element with the serialized `ArdoPageData`. */
export const ARDO_PAGE_DATA_ATTRIBUTE = "data-ardo-page"
