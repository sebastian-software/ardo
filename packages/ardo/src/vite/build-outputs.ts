import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { createVersioningBuildOutputAssets, getVersioningRedirects } from "./build-versioning"
import { createLlmsTextAssets, type LlmsTextOptions } from "./llms-text"
import { buildPublicPath } from "./route-identity"
import { generateSitemap } from "./sitemap"

export { generateSitemap } from "./sitemap"

export type BuildOutputAsset = {
  fileName: string
  source: string
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
  redirects.push(...getVersioningRedirects(config, entries))

  for (const entry of entries) {
    if (
      config.i18n !== false &&
      config.i18n.redirectUnlocalized === true &&
      entry.sourceLocaleId === config.i18n.defaultLocale &&
      entry.routePath !== "/" &&
      !config.i18n.locales.some(({ id }) => id === entry.routePath.split("/")[1])
    ) {
      redirects.push({
        from: buildPublicPath({ basePath: config.base, routePath: entry.routePath }),
        to: entry.publicPath,
      })
    }
    for (const from of entry.metadata.redirectFrom ?? []) {
      // Keep `from` as the authored static source path; `to` uses the canonical
      // public route because generated HTML and provider redirects share this contract.
      redirects.push({ from, to: entry.publicPath })
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
    `  <script>const target=new URL(${JSON.stringify(to)},location.href);if(target.origin===location.origin){if(!target.search)target.search=location.search;if(!target.hash)target.hash=location.hash}location.replace(target.href)</script>`,
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

export function createBuildOutputAssets(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  llms: LlmsTextOptions = {}
): BuildOutputAsset[] {
  const assets: BuildOutputAsset[] = []
  if (config.seo.sitemap !== false) {
    assets.push({ fileName: "sitemap.xml", source: generateSitemap(entries, config) })
  }

  if (config.seo.robots !== false) {
    assets.push({ fileName: "robots.txt", source: generateRobots(config) })
  }

  if (config.seo.llms !== false) {
    assets.push(...createLlmsTextAssets(entries, config, llms))
  }

  assets.push(...createVersioningBuildOutputAssets(config))

  const redirects = collectRedirects(entries, config)
  if (redirects.length === 0) {
    return assets
  }

  assets.push(...createRedirectAssets(redirects, config.deploymentBase))

  return assets
}

function createRedirectAssets(
  redirects: Array<{ from: string; to: string }>,
  deploymentBase: string
): BuildOutputAsset[] {
  const assets: BuildOutputAsset[] = [
    { fileName: "_redirects", source: generateNetlifyRedirects(redirects) },
    { fileName: "vercel.json", source: generateVercelRedirects(redirects) },
  ]

  for (const redirect of redirects) {
    assets.push({
      fileName: toRedirectAssetName(redirect.from, deploymentBase),
      source: generateRedirectHtml(redirect.to),
    })
  }

  return assets
}

function toRedirectAssetName(from: string, deploymentBase: string) {
  // Public URLs include the deployment prefix; artifact paths start below it.
  // Authored redirect sources without that prefix already name artifact paths.
  const relative = from.startsWith(deploymentBase)
    ? from.slice(deploymentBase.length)
    : from === deploymentBase.slice(0, -1)
      ? ""
      : from
  const routePath = relative.replace(/^\//u, "").replace(/\/$/u, "")
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
  const basePath = joinUrlPath(config.deploymentBase, routePath)
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

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
}
