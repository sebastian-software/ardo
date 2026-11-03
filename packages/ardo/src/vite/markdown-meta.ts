import type { MetadataConfig, ResolvedConfig } from "../config/types"

import { extractFrontmatterValue } from "./markdown-frontmatter"
import { buildTechArticleEntry } from "./markdown-structured-data"
import { isPathInsideDirectory, normalizePath } from "./path-utils"
import { createSourceRouteIdentity } from "./route-identity"

type MarkdownMetaState = {
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MetaInput = {
  canonical?: string
  /** Locale id of the route, when the project has locales. */
  inLanguage?: string
  jsonLd: boolean
  pageTitle: string
  routePath: string
  siteMetadata: MetadataConfig
  /** Absolute URL of the site root, including the deployment base path. */
  siteRootUrl?: string
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
  if (!shouldInjectMeta(code, id, state)) {
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
  const siteUrl = state.resolvedConfig?.siteUrl ?? ""
  const route = getSourceRoute(id, state)
  const entries = buildMetaEntries({
    canonical: extractFrontmatterValue(code, "canonical"),
    inLanguage: route.localeId,
    jsonLd: state.resolvedConfig?.seo.jsonLd !== false,
    pageTitle,
    routePath: route.publicPath,
    siteMetadata: state.resolvedConfig?.metadata ?? {},
    siteRootUrl: toAbsoluteUrl(state.resolvedConfig?.deploymentBase ?? "/", siteUrl),
    siteUrl,
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

function getSourceRoute(
  id: string,
  state: MarkdownMetaState
): { localeId?: string; publicPath: string } {
  const relative = normalizePath(id)
    .slice(normalizePath(state.routesDir).length)
    .replace(/^\//u, "")
  const name = relative.replace(/\.(?:md|mdx)$/u, "").replace(/(?:^|\/)(?:index|home)$/u, "")
  const routePath = `/${name}`
  if (state.resolvedConfig == null) {
    return { publicPath: routePath }
  }

  const identity = createSourceRouteIdentity(routePath, state.resolvedConfig)
  return { localeId: identity.localeId, publicPath: identity.publicPath }
}

function shouldInjectMeta(code: string, id: string, state: MarkdownMetaState): boolean {
  return isMarkdownFile(id) && isPathInsideDirectory(id, state.routesDir) && !hasMetaExport(code)
}

function buildMetaEntries(input: MetaInput): string[] {
  const meta = resolveSocialMeta(input)
  return [
    ...buildBaseMetaEntries(meta),
    ...buildOpenGraphMetaEntries(meta),
    ...buildTwitterMetaEntries(meta),
    ...buildStructuredDataEntries(input, meta),
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

// JSON-LD needs absolute URLs, so it is only emitted for a configured siteUrl.
function buildStructuredDataEntries(input: MetaInput, meta: ResolvedSocialMeta): string[] {
  if (!input.jsonLd || input.siteUrl.trim() === "") {
    return []
  }

  return [
    buildTechArticleEntry({
      headline: input.pageTitle,
      description: meta.description,
      url: meta.canonicalUrl,
      inLanguage: input.inLanguage,
      image: meta.ogImage,
      siteName: input.siteTitle,
      siteRootUrl: input.siteRootUrl,
    }),
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

function isMarkdownFile(id: string): boolean {
  return id.endsWith(".md") || id.endsWith(".mdx")
}

// A page's own `meta` export starts a line of the compiled module. Code samples
// that show such an export end up inside string literals, so they do not match.
const META_EXPORT = /^export\s+(?:const|let|function|async\s+function)\s+meta\b/mu

function hasMetaExport(code: string): boolean {
  return META_EXPORT.test(code)
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
