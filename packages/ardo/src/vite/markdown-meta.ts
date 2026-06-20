import type { ResolvedConfig } from "../config/types"

type MarkdownMetaState = {
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MetaInput = {
  canonical?: string
  pageTitle: string
  routePath: string
  siteMetadata: {
    image?: string
    ogType?: string
    twitterCard?: string
    twitterSite?: string
  }
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
  const entries = buildMetaEntries({
    canonical: extractFrontmatterValue(code, "canonical"),
    pageTitle,
    routePath: getRoutePathFromId(id, state.routesDir),
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

function shouldInjectMeta(code: string, id: string, state: MarkdownMetaState): boolean {
  return isMarkdownFile(id) && id.startsWith(state.routesDir) && !hasMetaExport(code)
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

function isMarkdownFile(id: string): boolean {
  return id.endsWith(".md") || id.endsWith(".mdx")
}

function hasMetaExport(code: string): boolean {
  return code.includes("export const meta") || code.includes("export function meta")
}

function extractFrontmatterValue(code: string, key: string): string | undefined {
  const frontmatterStart = code.indexOf("export const frontmatter")
  if (frontmatterStart === -1) {
    return undefined
  }

  const valuePrefix = `${key}: "`
  const valueStart = code.indexOf(valuePrefix, frontmatterStart)
  if (valueStart === -1) {
    return undefined
  }

  const startIndex = valueStart + valuePrefix.length
  const endIndex = code.indexOf('"', startIndex)
  if (endIndex === -1) {
    return undefined
  }

  return code.slice(startIndex, endIndex)
}

function getRoutePathFromId(id: string, routesDir: string) {
  const relativePath = id.slice(routesDir.length).replaceAll("\\", "/").replace(/^\//u, "")
  const withoutExtension = relativePath.replace(/\.(?:md|mdx)$/u, "")
  if (withoutExtension === "index" || withoutExtension === "home") return "/"
  if (withoutExtension.endsWith("/index") || withoutExtension.endsWith("/home")) {
    return `/${withoutExtension.slice(0, withoutExtension.lastIndexOf("/"))}`
  }
  return `/${withoutExtension}`
}

function toAbsoluteUrl(value: string | undefined, siteUrl: string): string | undefined {
  if (value == null || value === "") {
    return
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  if (siteUrl === "") {
    return value
  }

  const normalizedSiteUrl = siteUrl.replace(/\/$/u, "")
  const normalizedPath = value.startsWith("/") ? value : `/${value}`
  return `${normalizedSiteUrl}${normalizedPath}`
}

function defaultTwitterCard(image: string | undefined) {
  return image == null ? "summary" : "summary_large_image"
}
