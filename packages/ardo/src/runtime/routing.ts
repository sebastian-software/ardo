import type { ComponentType, ReactNode } from "react"

import type { ArdoMetaDescriptor, ArdoPage, ArdoPageError } from "./page-context"

import { ArdoErrorBoundary } from "../ui/ErrorBoundary"

/** Exports Ardo reads from a route module. */
export type ArdoRouteModule = {
  default?: ComponentType
  handle?: unknown
  meta?: () => ArdoMetaDescriptor[]
}

/** Exports Ardo reads from `app/root.tsx`. */
export type ArdoRootModule = ArdoRouteModule & {
  ErrorBoundary?: ComponentType
  Layout?: ComponentType<{ children: ReactNode }>
}

export type ArdoRouteEntry = {
  /** Route file relative to the project root, for example `app/routes/guide/intro.mdx`. */
  id: string
  /** URL path without the base path, for example `/guide/intro`. Segments may be `:param`. */
  path: string
  source?: ArdoPage["source"]
  load: () => Promise<ArdoRouteModule>
}

/** Serializable description of a rendered page, shared by server and client. */
export type ArdoPageData = {
  base: string
  error?: { status: number; message?: string }
  path: string
  routeId?: string
  source?: ArdoPage["source"]
}

export type ArdoResolvedPage = {
  component: ComponentType
  data: ArdoPageData
  error?: ArdoPageError
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
  route: ArdoRouteEntry | undefined
  error?: ArdoPageData["error"]
  source?: ArdoPage["source"]
}): Promise<ArdoResolvedPage> {
  const { base, path, root, route } = input
  const module = input.error == null && route != null ? await route.load() : undefined
  if (module?.default != null && route != null) {
    return {
      component: module.default,
      data: { base, path, routeId: route.id, source: input.source ?? route.source },
      handle: module.handle,
      source: input.source ?? route.source,
      meta: (module.meta ?? root.meta)?.() ?? [],
    }
  }
  const error = input.error ?? { status: 404, message: `No page at ${path}` }
  return {
    component: root.ErrorBoundary ?? ArdoErrorBoundary,
    data: { base, error, path },
    error,
    meta: root.meta?.() ?? [],
  }
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
