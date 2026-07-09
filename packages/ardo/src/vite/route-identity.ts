import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"

export type RouteIdentity = {
  versionId?: string
  localeId?: string
  routePath: string
  publicPath: string
}

export type RouteIdentityInput = {
  basePath?: string
  localeId?: string
  routePath: string
  versionId?: string
}

export function createRouteIdentity(input: RouteIdentityInput): RouteIdentity {
  const routePath = normalizeRoutePath(input.routePath)
  const localeId = normalizeOptionalSegment(input.localeId)
  const versionId = normalizeOptionalSegment(input.versionId)

  return {
    ...(versionId == null ? {} : { versionId }),
    ...(localeId == null ? {} : { localeId }),
    routePath,
    publicPath: buildPublicPath({
      basePath: input.basePath,
      localeId,
      routePath,
    }),
  }
}

export function createCurrentRouteIdentity(
  routePath: string,
  config: Pick<ResolvedConfig, "base" | "i18n" | "versioning">,
  options: { localeId?: string } = {}
): RouteIdentity {
  return createRouteIdentity({
    basePath: config.base,
    localeId: options.localeId ?? getDefaultLocaleId(config.i18n),
    routePath,
    versionId: config.versioning === false ? undefined : config.versioning.current,
  })
}

export function buildPublicPath(input: {
  basePath?: string
  localeId?: string
  routePath: string
}): string {
  const baseSegments = splitPathSegments(input.basePath ?? "/")
  const localeSegment = normalizeOptionalSegment(input.localeId)
  const routeSegments = splitPathSegments(normalizeRoutePath(input.routePath))
  const segments = localeSegment == null ? baseSegments : [...baseSegments, localeSegment]
  segments.push(...routeSegments)

  if (segments.length === 0) {
    return "/"
  }

  const path = `/${segments.join("/")}`
  return routeSegments.length === 0 ? `${path}/` : path
}

export function normalizeRoutePath(routePath: string): string {
  const segments = splitPathSegments(routePath)
  return segments.length === 0 ? "/" : `/${segments.join("/")}`
}

function splitPathSegments(value: string): string[] {
  return value
    .trim()
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function normalizeOptionalSegment(value: string | undefined): string | undefined {
  if (value == null) {
    return undefined
  }

  const segments = splitPathSegments(value)
  return segments.length === 0 ? undefined : segments.join("/")
}
