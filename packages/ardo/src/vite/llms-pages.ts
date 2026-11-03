import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { resolveLlmsContentLinks } from "./llms-links"
import { stripMdxSyntaxOutsideCodeFences } from "./llms-mdx-strip"

/**
 * Renders each page's cleaned Markdown body. `llms-full.txt` and the per-page files share it,
 * so both carry the same content. Headings keep their authored levels; each caller shifts its own.
 */
export function createLlmsBodyRenderer(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): (entry: RouteManifestEntry, title: string) => string {
  const routePaths = collectRoutePaths(entries)
  return (entry, title) => {
    // A Markdown page is not MDX: a line starting with "export" is prose there.
    const format = entry.filePath.endsWith(".mdx") ? "mdx" : "md"
    // Rewrite projected Markdown as Markdown: angle-wrapped local URLs are not MDX JSX.
    const body = resolveLlmsContentLinks(
      stripMdxSyntaxOutsideCodeFences(entry.content, title, { format, markdown: config.markdown }),
      {
        ...entry,
        routePaths,
        routeHrefs: llmsRouteHrefs(entries, entry, config),
        format: "md",
      },
      config
    )
    // Removing the title heading and MDX syntax leaves runs of blank lines behind.
    return collapseBlankLines(body).replace(/^(?:[ \t]*\r?\n)+/u, "")
  }
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/u

/** Keep at most one blank line between blocks, leaving fenced code untouched. */
function collapseBlankLines(markdown: string): string {
  const output: string[] = []
  let fence: string | undefined
  for (const line of markdown.split("\n")) {
    const marker = FENCE.exec(line)?.[1]
    if (fence == null && marker != null) {
      fence = marker
    } else if (fence != null && marker?.[0] === fence[0] && marker.length >= fence.length) {
      fence = undefined
    } else if (fence == null && line.trim() === "" && output.at(-1)?.trim() === "") {
      continue
    }
    output.push(line)
  }
  return output.join("\n")
}

/**
 * The URL path of a page's Markdown file, following the llmstxt.org convention: the page URL
 * with `.md` appended. A directory root (`/`, `/v6/`, `/v6/de/`) names `index.md` inside it.
 */
export function toPageMarkdownPath(publicPath: string): string {
  return publicPath.endsWith("/") ? `${publicPath}index.md` : `${publicPath}.md`
}

/** The page's Markdown file, relative to the deployment output root. */
export function toPageMarkdownFileName(publicPath: string, deploymentBase: string): string {
  const markdownPath = toPageMarkdownPath(publicPath)
  return markdownPath.startsWith(deploymentBase)
    ? markdownPath.slice(deploymentBase.length)
    : markdownPath.replace(/^\/+/u, "")
}

function collectRoutePaths(entries: RouteManifestEntry[]): ReadonlySet<string> {
  return new Set(
    entries.flatMap((entry) => [
      entry.routePath,
      ...(entry.sourceLocaleId == null
        ? []
        : [`/${entry.sourceLocaleId}${entry.routePath === "/" ? "" : entry.routePath}`]),
    ])
  )
}

function llmsRouteHrefs(
  entries: RouteManifestEntry[],
  entry: RouteManifestEntry,
  config: ResolvedConfig
): ReadonlyMap<string, string> | undefined {
  if (config.versioning === false || config.versioning.directories == null) return
  const hrefs = new Map<string, string>()
  for (const target of entries) {
    if (target.sourceLocaleId != null)
      hrefs.set(
        `/${target.sourceLocaleId}${target.routePath === "/" ? "" : target.routePath}`,
        target.publicPath
      )
    if (target.identity.localeId === entry.identity.localeId)
      hrefs.set(target.routePath, target.publicPath)
  }
  return hrefs
}
