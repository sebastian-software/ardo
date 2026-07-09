import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { createVersioningBuildOutputAssets, getRootVersionRedirect } from "./build-versioning"
import { createLlmsTextAssets } from "./llms-text"

type LinkCheckDiagnostic = {
  filePath: string
  href: string
  message: string
}

type LinkCheckContext = {
  config: ResolvedConfig
  excludedPatterns: string[]
  routeMap: Map<string, RouteManifestEntry>
}

export type BuildOutputAsset = {
  fileName: string
  source: string
}

export function generateSitemap(entries: RouteManifestEntry[], config: ResolvedConfig) {
  const sitemapConfig = typeof config.seo.sitemap === "object" ? config.seo.sitemap : {}
  const changefreq = sitemapConfig.changefreq ?? "weekly"
  const priority = sitemapConfig.priority ?? 0.7
  const urls = entries
    .filter((entry) => entry.frontmatter.sitemap !== false)
    .map((entry) => {
      const loc = toAbsoluteUrl(entry.path, config)
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${entry.lastmod.toISOString()}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n")
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n")
}

export function generateRobots(config: ResolvedConfig) {
  const robotsConfig = typeof config.seo.robots === "object" ? config.seo.robots : {}
  const allowRules = robotsConfig.allow ?? ["/"]
  const disallowRules = robotsConfig.disallow ?? []
  const lines = ["User-agent: *"]

  for (const rule of allowRules) {
    lines.push(`Allow: ${rule}`)
  }

  for (const rule of disallowRules) {
    lines.push(`Disallow: ${rule}`)
  }

  lines.push(`Sitemap: ${toAbsoluteUrl("/sitemap.xml", config)}`)
  return `${lines.join("\n")}\n`
}

export function collectRedirects(entries: RouteManifestEntry[], config: ResolvedConfig) {
  const redirects = [...config.redirects]
  const rootVersionRedirect = getRootVersionRedirect(config)
  if (rootVersionRedirect != null) {
    redirects.push(rootVersionRedirect)
  }

  for (const entry of entries) {
    for (const from of entry.frontmatter.redirectFrom ?? []) {
      redirects.push({ from, to: entry.path })
    }
  }

  return dedupeRedirects(redirects)
}

export function generateRedirectHtml(to: string) {
  const escapedTo = escapeHtml(to)
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    `  <meta http-equiv="refresh" content="0; url=${escapedTo}">`,
    `  <link rel="canonical" href="${escapedTo}">`,
    `  <script>location.replace(${JSON.stringify(to)})</script>`,
    "</head>",
    `<body><a href="${escapedTo}">Continue</a></body>`,
    "</html>",
    "",
  ].join("\n")
}

export function generateNetlifyRedirects(redirects: Array<{ from: string; to: string }>) {
  return `${redirects.map((redirect) => `${redirect.from} ${redirect.to} 301`).join("\n")}\n`
}

export function generateVercelRedirects(redirects: Array<{ from: string; to: string }>) {
  return `${JSON.stringify(
    {
      redirects: redirects.map((redirect) => ({
        source: redirect.from,
        destination: redirect.to,
        permanent: true,
      })),
    },
    null,
    2
  )}\n`
}

export function checkInternalLinks(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): LinkCheckDiagnostic[] {
  if (config.linkCheck.enabled === false) {
    return []
  }

  const excludedPatterns = config.linkCheck.exclude ?? []
  const routeMap = new Map(entries.map((entry) => [entry.path, entry]))
  const diagnostics: LinkCheckDiagnostic[] = []

  for (const entry of entries) {
    diagnostics.push(...checkEntryLinks(entry, { config, excludedPatterns, routeMap }))
  }

  return diagnostics
}

export function createBuildOutputAssets(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): BuildOutputAsset[] {
  const assets: BuildOutputAsset[] = []
  if (config.seo.sitemap !== false) {
    assets.push({ fileName: "sitemap.xml", source: generateSitemap(entries, config) })
  }

  if (config.seo.robots !== false) {
    assets.push({ fileName: "robots.txt", source: generateRobots(config) })
  }

  if (config.seo.llms !== false) {
    assets.push(...createLlmsTextAssets(entries, config))
  }

  assets.push(...createVersioningBuildOutputAssets(config))

  const redirects = collectRedirects(entries, config)
  if (redirects.length === 0) {
    return assets
  }

  assets.push(...createRedirectAssets(redirects))

  return assets
}

function createRedirectAssets(redirects: Array<{ from: string; to: string }>): BuildOutputAsset[] {
  const assets: BuildOutputAsset[] = [
    { fileName: "_redirects", source: generateNetlifyRedirects(redirects) },
    { fileName: "vercel.json", source: generateVercelRedirects(redirects) },
  ]

  for (const redirect of redirects) {
    assets.push({
      fileName: toRedirectAssetName(redirect.from),
      source: generateRedirectHtml(redirect.to),
    })
  }

  return assets
}

export function formatLinkCheckDiagnostics(diagnostics: LinkCheckDiagnostic[]) {
  return diagnostics.map((diagnostic) => `${diagnostic.filePath}: ${diagnostic.message}`).join("\n")
}

function extractInternalLinks(content: string) {
  const links = new Set<string>()
  collectMarkdownLinks(content, links)
  collectJsxHrefLinks(content, links)

  return [...links].filter((link) => link !== "" && !link.startsWith("//"))
}

function normalizeInternalPath(hrefPath: string, currentPath: string) {
  if (hrefPath === "") {
    return currentPath
  }

  return hrefPath.length > 1 ? hrefPath.replace(/\/$/u, "") : hrefPath
}

function isExcludedLink(href: string, patterns: string[]) {
  return patterns.some((pattern) => matchesPattern(href, pattern))
}

function matchesPattern(value: string, pattern: string) {
  if (!pattern.includes("*")) {
    return value === pattern
  }

  const [prefix = "", suffix = ""] = pattern.split("*")
  return value.startsWith(prefix) && value.endsWith(suffix)
}

function checkEntryLinks(
  entry: RouteManifestEntry,
  context: LinkCheckContext
): LinkCheckDiagnostic[] {
  const diagnostics: LinkCheckDiagnostic[] = []
  for (const href of extractInternalLinks(entry.content)) {
    const diagnostic = checkSingleLink(entry, href, context)
    if (diagnostic != null) {
      diagnostics.push(diagnostic)
    }
  }
  return diagnostics
}

function checkSingleLink(
  entry: RouteManifestEntry,
  href: string,
  context: LinkCheckContext
): LinkCheckDiagnostic | null {
  if (isExcludedLink(href, context.excludedPatterns)) {
    return null
  }

  const [targetPath = "", targetAnchor = ""] = href.split("#")
  const normalizedPath = normalizeInternalPath(targetPath, entry.path)
  const targetEntry = context.routeMap.get(normalizedPath)
  if (targetEntry == null) {
    return { filePath: entry.filePath, href, message: `Missing internal route: ${href}` }
  }

  if (
    context.config.linkCheck.checkAnchors !== false &&
    targetAnchor !== "" &&
    !targetEntry.anchors.includes(targetAnchor)
  ) {
    return {
      filePath: entry.filePath,
      href,
      message: `Missing anchor "${targetAnchor}" on ${normalizedPath}`,
    }
  }

  return null
}

function collectMarkdownLinks(content: string, links: Set<string>) {
  let offset = 0
  while (offset < content.length) {
    const start = content.indexOf("](/", offset)
    if (start === -1) return

    const hrefStart = start + 2
    const hrefEnd = content.indexOf(")", hrefStart)
    if (hrefEnd === -1) return

    links.add(content.slice(hrefStart, hrefEnd))
    offset = hrefEnd + 1
  }
}

function collectJsxHrefLinks(content: string, links: Set<string>) {
  collectQuotedHrefLinks({ content, links, marker: 'href="/', quote: '"' })
  collectQuotedHrefLinks({ content, links, marker: "href='/", quote: "'" })
}

function collectQuotedHrefLinks({
  content,
  links,
  marker,
  quote,
}: {
  content: string
  links: Set<string>
  marker: string
  quote: string
}) {
  let offset = 0
  while (offset < content.length) {
    const start = content.indexOf(marker, offset)
    if (start === -1) return

    const hrefStart = start + marker.length - 1
    const hrefEnd = content.indexOf(quote, hrefStart)
    if (hrefEnd === -1) return

    links.add(content.slice(hrefStart, hrefEnd))
    offset = hrefEnd + 1
  }
}

function toRedirectAssetName(from: string) {
  const routePath = from.replace(/^\//u, "").replace(/\/$/u, "")
  return routePath === "" ? "index.html" : `${routePath}/index.html`
}

function dedupeRedirects(redirects: Array<{ from: string; to: string }>) {
  const seen = new Set<string>()
  const deduped: Array<{ from: string; to: string }> = []

  for (const redirect of redirects) {
    const key = `${redirect.from}\n${redirect.to}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(redirect)
    }
  }

  return deduped
}

function toAbsoluteUrl(routePath: string, config: ResolvedConfig) {
  const basePath = joinUrlPath(config.base, routePath)
  if (config.siteUrl === "") {
    return basePath
  }

  return `${config.siteUrl.replace(/\/$/u, "")}${basePath}`
}

function joinUrlPath(basePath: string, routePath: string) {
  const normalizedBase = basePath === "/" ? "" : `/${basePath.replaceAll(/^\/|\/$/gu, "")}`
  const normalizedRoute = routePath === "/" ? "/" : `/${routePath.replaceAll(/^\/|\/$/gu, "")}`
  return `${normalizedBase}${normalizedRoute}` || "/"
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
}
