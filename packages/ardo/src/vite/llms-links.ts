import { prepareDocument } from "ferromark"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { normalizeBasePath } from "../config/versioning"
import { resolveArdoHref } from "../runtime/page-context"

const localOrigin = "https://ardo.invalid"
type LinkContext = Pick<RouteManifestEntry, "publicPath" | "routePath"> & {
  /** Markdown pages are parsed as Markdown, not MDX. Defaults to MDX. */
  format?: "md" | "mdx"
  routePaths?: ReadonlySet<string>
}
type LinkConfig = Pick<
  ResolvedConfig,
  "base" | "deploymentBase" | "siteUrl" | "versioning" | "i18n"
>

/** Native source spans identify links without touching code, images, or external URLs. */
export function resolveLlmsContentLinks(
  content: string,
  entry: LinkContext,
  config: LinkConfig
): string {
  const bytes = Buffer.from(content)
  const replacements = prepareDocument(content, { format: entry.format ?? "mdx" })
    .collectReferences()
    .flatMap((reference) => {
      if (reference.kind !== "link" || reference.span == null) return []
      const destination = resolveDestination(reference.destination, entry, config)
      if (destination == null) return []
      const original = bytes.subarray(reference.span.start, reference.span.end).toString()
      const label = readLabel(original)
      if (label == null) return []
      const title = reference.title == null ? "" : ` "${escapeTitle(reference.title)}"`
      return [{ ...reference.span, content: `${label}(<${destination}>${title})` }]
    })
  let result = bytes
  for (const replacement of replacements.sort((left, right) => right.start - left.start))
    result = Buffer.concat([
      result.subarray(0, replacement.start),
      Buffer.from(replacement.content),
      result.subarray(replacement.end),
    ])
  return result.toString()
}

function resolveDestination(destination: string, entry: LinkContext, config: LinkConfig) {
  if (/^[a-z][\d+.a-z-]*:/iu.test(destination) || destination.startsWith("//")) return
  const base = entry.publicPath.endsWith(entry.routePath)
    ? entry.publicPath.slice(0, -entry.routePath.length) || "/"
    : config.base
  const firstSegment = destination.startsWith("/") ? destination.split(/[/?#]/u)[1] : undefined
  const explicitLocale =
    config.i18n !== false && config.i18n.locales.some((locale) => locale.id === firstSegment)
  const page = { base: explicitLocale ? config.base : base, path: entry.routePath }
  const publicPage = new URL(entry.publicPath, config.siteUrl || localOrigin)
  const mounted = isMountedPath(destination, config)
  const href = mounted ? destination : resolveArdoHref(destination, page, entry.routePaths)
  const target = new URL(href, publicPage)
  return config.siteUrl === "" ? target.pathname + target.search + target.hash : target.href
}

function isMountedPath(destination: string, config: LinkConfig): boolean {
  if (!destination.startsWith("/")) return false
  const pathname = destination.split(/[?#]/u)[0]
  const bases = [
    config.base,
    config.deploymentBase,
    ...(config.versioning === false
      ? []
      : config.versioning.versions.map((version) => version.path)),
  ]
  return bases.some((base) => {
    const prefix = normalizeBasePath(base)
    return prefix !== "/" && (pathname === prefix.slice(0, -1) || pathname.startsWith(prefix))
  })
}

/** Keep authored label formatting, including nested images and inline code. */
function readLabel(source: string): string | undefined {
  if (!source.startsWith("[")) return undefined
  let depth = 0
  for (let index = 0; index < source.length; index++) {
    const character = source[index]
    if (character === "\\") index++
    else if (character === "`") index = inlineCodeEnd(source, index)
    else if (character === "[") depth++
    else if (character === "]" && --depth === 0) return source.slice(0, index + 1)
  }
  return undefined
}

function inlineCodeEnd(source: string, start: number): number {
  const opening = backtickRunEnd(source, start)
  const length = opening - start
  for (let index = opening; index < source.length; index++) {
    if (source[index] !== "`") continue
    const end = backtickRunEnd(source, index)
    if (end - index === length) return end - 1
    index = end - 1
  }
  return opening - 1
}

function backtickRunEnd(source: string, start: number): number {
  let end = start
  while (source[end] === "`") end++
  return end
}

function escapeTitle(title: string): string {
  return title.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}
