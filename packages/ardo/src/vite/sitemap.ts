import type { ResolvedConfig } from "../config/types"
import { spellPagePath } from "../runtime/trailing-slash"
import { isDynamicRoutePath, type RouteManifestEntry } from "./route-manifest"

/**
 * When a page last changed: a post's own dates, else the page file's last commit, else its file
 * time. Never later than a pinned `buildTime`, so a build at that moment reports no later change.
 */
export function sitemapLastmod(
  entry: RouteManifestEntry,
  config: Pick<ResolvedConfig, "buildTime">,
  commitTime?: (filePath: string) => number | undefined
): Date {
  const dated = typeof entry.frontmatter.publishedAt === "string"
  const commit = dated ? undefined : commitTime?.(entry.filePath)
  const date = commit == null ? entry.lastmod : new Date(commit)
  if (config.buildTime == null) return date
  const pinned = new Date(config.buildTime)
  return date > pinned ? pinned : date
}

export function generateSitemap(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  commitTime?: (filePath: string) => number | undefined
) {
  const sitemapConfig = typeof config.seo.sitemap === "object" ? config.seo.sitemap : {}
  const changefreq = sitemapConfig.changefreq ?? "weekly"
  const priority = sitemapConfig.priority ?? 0.7
  const excludedPaths = (sitemapConfig.exclude ?? []).map((prefix) => trimTrailingSlashes(prefix))
  const urls = entries
    .filter(
      (entry) =>
        entry.metadata.sitemap !== false &&
        !isDynamicRoutePath(entry.routePath) &&
        !excludedPaths.some(
          (prefix) => entry.routePath === prefix || entry.routePath.startsWith(`${prefix}/`)
        )
    )
    .map((entry) => {
      const loc = toAbsolutePublicUrl(
        encodeUrlPath(spellPagePath(entry.publicPath, config.trailingSlash, config.deploymentBase)),
        config
      )
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${sitemapLastmod(entry, config, commitTime).toISOString()}</lastmod>`,
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

function trimTrailingSlashes(prefix: string): string {
  let end = prefix.length
  while (end > 0 && prefix[end - 1] === "/") end--
  return prefix.slice(0, end)
}

function toAbsolutePublicUrl(publicPath: string, config: ResolvedConfig) {
  if (config.siteUrl === "") {
    return publicPath
  }

  return `${config.siteUrl.replace(/\/$/u, "")}${publicPath}`
}

/**
 * Percent-encodes a path the way canonical links (`new URL(path, siteUrl)`) do: spaces and
 * non-ASCII characters are encoded, existing `%XX` escapes stay as they are.
 */
function encodeUrlPath(publicPath: string): string {
  return new URL(publicPath, "https://ardo.invalid").pathname
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
