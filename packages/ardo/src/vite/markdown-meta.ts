import type { MetadataConfig, ResolvedConfig } from "../config/types"

import { extractFrontmatterValue } from "./route-frontmatter"
import { getMarkdownFormat } from "./mdx-plugin"
import { isPathInsideDirectory, normalizePath } from "./path-utils"

type MarkdownMetaState = {
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MetaInput = {
  canonical?: string
  pageTitle: string
  routePath: string
  siteMetadata: MetadataConfig
  siteUrl: string
  siteTitle: string
  titleSeparator: string
  description?: string
  ogDescription?: string
  ogImage?: string
  ogTitle?: string
  ogType?: string
  twitterCard?: string
  twitterDescription?: string
  twitterImage?: string
  twitterTitle?: string
}

type ResolvedSocialMeta = {
  canonicalUrl?: string
  description: string
  fullTitle: string
  ogDescription: string
  ogImage?: string
  ogTitle: string
  ogType: string
  twitterCard: string
  twitterDescription: string
  twitterImage?: string
  twitterSite?: string
  twitterTitle: string
}

export function transformMarkdownMeta(
  code: string,
  id: string,
  state: MarkdownMetaState
): { code: string; map: null } | undefined {
  // React Router loads client route chunks under a query; they need meta too.
  const path = id.split("?", 1)[0] ?? id
  if (getMarkdownFormat(id) == null || !shouldInjectMeta(code, path, state)) {
    return undefined
  }

  const pageTitle = extractFrontmatterValue(code, "title")
  if (pageTitle == null || pageTitle === "") {
    return undefined
  }

  const siteTitle = state.resolvedConfig?.title ?? "Ardo"
  const titleSeparator = state.resolvedConfig?.titleSeparator ?? " | "
  const siteDescription = state.resolvedConfig?.description ?? ""
  const description = extractFrontmatterValue(code, "description") ?? siteDescription
  const entries = buildMetaEntries({
    canonical: extractFrontmatterValue(code, "canonical"),
    pageTitle,
    routePath: getRoutePathFromId(path, state.routesDir, state.resolvedConfig?.base ?? "/"),
    siteMetadata: state.resolvedConfig?.metadata ?? {},
    siteUrl: state.resolvedConfig?.siteUrl ?? "",
    siteTitle,
    titleSeparator,
    description,
    ogDescription: extractFrontmatterValue(code, "ogDescription"),
    ogImage: extractFrontmatterValue(code, "ogImage"),
    ogTitle: extractFrontmatterValue(code, "ogTitle"),
    ogType: extractFrontmatterValue(code, "ogType"),
    twitterCard: extractFrontmatterValue(code, "twitterCard"),
    twitterDescription: extractFrontmatterValue(code, "twitterDescription"),
    twitterImage: extractFrontmatterValue(code, "twitterImage"),
    twitterTitle: extractFrontmatterValue(code, "twitterTitle"),
  })
  return { code: `${code}\nexport const meta = () => [${entries.join(", ")}];\n`, map: null }
}

function shouldInjectMeta(code: string, path: string, state: MarkdownMetaState): boolean {
  return isPathInsideDirectory(path, state.routesDir) && !hasMetaExport(code)
}

function buildMetaEntries(input: MetaInput): string[] {
  const meta = resolveSocialMeta(input)
  return [
    ...buildBaseMetaEntries(meta),
    ...buildOpenGraphMetaEntries(meta),
    ...buildTwitterMetaEntries(meta),
  ]
}

function resolveSocialMeta(input: MetaInput): ResolvedSocialMeta {
  const fullTitle = `${input.pageTitle}${input.titleSeparator}${input.siteTitle}`
  const description = input.description ?? ""
  const ogTitle = input.ogTitle ?? fullTitle
  const ogDescription = input.ogDescription ?? description
  const ogImage = toAbsoluteUrl(input.ogImage ?? input.siteMetadata.image, input.siteUrl)
  const canonicalUrl = toAbsoluteUrl(input.canonical ?? input.routePath, input.siteUrl)

  return {
    canonicalUrl,
    description,
    fullTitle,
    ogDescription,
    ogImage,
    ogTitle,
    ogType: input.ogType ?? input.siteMetadata.ogType ?? "article",
    twitterCard: input.twitterCard ?? input.siteMetadata.twitterCard ?? defaultTwitterCard(ogImage),
    twitterDescription: input.twitterDescription ?? ogDescription,
    twitterImage: toAbsoluteUrl(input.twitterImage ?? ogImage, input.siteUrl),
    twitterSite: input.siteMetadata.twitterSite,
    twitterTitle: input.twitterTitle ?? ogTitle,
  }
}

function buildBaseMetaEntries(meta: ResolvedSocialMeta): string[] {
  const entries = [`{ title: ${JSON.stringify(meta.fullTitle)} }`]
  if (meta.description !== "") {
    entries.push(`{ name: "description", content: ${JSON.stringify(meta.description)} }`)
  }
  return entries
}

function buildOpenGraphMetaEntries(meta: ResolvedSocialMeta): string[] {
  return [
    `{ property: "og:title", content: ${JSON.stringify(meta.ogTitle)} }`,
    ...optionalMetaEntry("property", "og:description", meta.ogDescription),
    `{ property: "og:type", content: ${JSON.stringify(meta.ogType)} }`,
    ...optionalMetaEntry("property", "og:image", meta.ogImage),
    ...optionalCanonicalEntries(meta.canonicalUrl),
  ]
}

function buildTwitterMetaEntries(meta: ResolvedSocialMeta): string[] {
  return [
    `{ name: "twitter:card", content: ${JSON.stringify(meta.twitterCard)} }`,
    `{ name: "twitter:title", content: ${JSON.stringify(meta.twitterTitle)} }`,
    ...optionalMetaEntry("name", "twitter:description", meta.twitterDescription),
    ...optionalMetaEntry("name", "twitter:image", meta.twitterImage),
    ...optionalMetaEntry("name", "twitter:site", meta.twitterSite),
  ]
}

function optionalMetaEntry(attribute: "name" | "property", key: string, value?: string): string[] {
  if (value == null || value === "") {
    return []
  }

  return [`{ ${attribute}: ${JSON.stringify(key)}, content: ${JSON.stringify(value)} }`]
}

function optionalCanonicalEntries(canonicalUrl?: string): string[] {
  if (canonicalUrl == null) {
    return []
  }

  return [
    `{ tagName: "link", rel: "canonical", href: ${JSON.stringify(canonicalUrl)} }`,
    `{ property: "og:url", content: ${JSON.stringify(canonicalUrl)} }`,
  ]
}

function hasMetaExport(code: string): boolean {
  return code.includes("export const meta") || code.includes("export function meta")
}

function getRoutePathFromId(id: string, routesDir: string, base: string) {
  const normalizedId = normalizePath(id)
  const normalizedRoutesDir = normalizePath(routesDir)
  const relativePath = normalizedId.slice(normalizedRoutesDir.length).replace(/^\//u, "")
  const withoutExtension = relativePath.replace(/\.(?:md|mdx)$/u, "")
  if (withoutExtension === "index" || withoutExtension === "home") return joinBasePath(base, "/")
  if (withoutExtension.endsWith("/index") || withoutExtension.endsWith("/home")) {
    return joinBasePath(base, `/${withoutExtension.slice(0, withoutExtension.lastIndexOf("/"))}`)
  }
  return joinBasePath(base, `/${withoutExtension}`)
}

function joinBasePath(base: string, routePath: string): string {
  const trimmedBase = base.trim()
  if (trimmedBase === "" || trimmedBase === "/") {
    return routePath
  }

  const baseWithLeadingSlash = trimmedBase.startsWith("/") ? trimmedBase : `/${trimmedBase}`
  const normalizedBase = trimTrailingSlashes(baseWithLeadingSlash)
  const normalizedRoutePath = routePath.startsWith("/") ? routePath : `/${routePath}`
  return `${normalizedBase}${normalizedRoutePath}`
}

function toAbsoluteUrl(value: string | undefined, siteUrl: string): string | undefined {
  const trimmedValue = value?.trim()
  if (trimmedValue == null || trimmedValue === "") {
    return
  }

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://") ||
    trimmedValue.startsWith("//")
  ) {
    return trimmedValue
  }

  const normalizedSiteUrl = trimTrailingSlashes(siteUrl.trim())
  if (normalizedSiteUrl === "") {
    return
  }

  const normalizedPath = trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`
  return `${normalizedSiteUrl}${normalizedPath}`
}

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") {
    end -= 1
  }
  return value.slice(0, end)
}

function defaultTwitterCard(image: string | undefined) {
  return image == null ? "summary" : "summary_large_image"
}
