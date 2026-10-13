import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

export function generateSitemap(entries: RouteManifestEntry[], config: ResolvedConfig) {
  const sitemapConfig = typeof config.seo.sitemap === "object" ? config.seo.sitemap : {}
  const changefreq = sitemapConfig.changefreq ?? "weekly"
  const priority = sitemapConfig.priority ?? 0.7
  const excludedPaths = (sitemapConfig.exclude ?? []).map((prefix) => trimTrailingSlashes(prefix))
  const urls = entries
    .filter(
      (entry) =>
        entry.metadata.sitemap !== false &&
        !excludedPaths.some(
          (prefix) => entry.routePath === prefix || entry.routePath.startsWith(`${prefix}/`)
        )
    )
    .map((entry) => {
      const loc = toAbsolutePublicUrl(entry.publicPath, config)
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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
