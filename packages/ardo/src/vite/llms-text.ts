import type { LlmsConfig, ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { stripMdxSyntaxOutsideCodeFences } from "./llms-mdx-strip"
import { buildPublicPath } from "./route-identity"

type LlmsRouteEntry = {
  source: "markdown"
} & RouteManifestEntry

type ResolvedLlmsConfig = Pick<LlmsConfig, "description" | "title"> &
  Required<Pick<LlmsConfig, "fullFileName" | "includeFull" | "indexFileName">>

type LlmsTextAsset = {
  fileName: string
  source: string
}

export function generateLlmsTxt(entries: RouteManifestEntry[], config: ResolvedConfig): string {
  const llmsConfig = resolveLlmsConfig(config)
  const docs = getLlmsEntries(entries)
  const lines = createHeaderLines(llmsConfig, config)

  appendDocsSection(lines, docs, config)
  appendFullDocSection(lines, llmsConfig, config)

  return `${lines.join("\n").trimEnd()}\n`
}

export function generateLlmsFullTxt(entries: RouteManifestEntry[], config: ResolvedConfig): string {
  const llmsConfig = resolveLlmsConfig(config)
  const lines = createHeaderLines(llmsConfig, config)

  for (const entry of getLlmsEntries(entries)) {
    const title = getEntryTitle(entry)
    const description = entry.frontmatter.description
    const content = sanitizeLlmsContent(entry.content, title)

    lines.push(`## ${title}`, "")
    if (description != null) {
      lines.push(description, "")
    }
    lines.push(`Source: ${toAbsolutePublicUrl(entry.publicPath, config)}`, "")
    if (content !== "") {
      lines.push(content, "")
    }
  }

  return `${lines.join("\n").trimEnd()}\n`
}

export function getLlmsAssetNames(config: ResolvedConfig) {
  const llmsConfig = resolveLlmsConfig(config)
  return {
    fullFileName: llmsConfig.fullFileName,
    includeFull: llmsConfig.includeFull,
    indexFileName: llmsConfig.indexFileName,
  }
}

export function createLlmsTextAssets(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): LlmsTextAsset[] {
  const llmsAssets = getLlmsAssetNames(config)
  const assets = [{ fileName: llmsAssets.indexFileName, source: generateLlmsTxt(entries, config) }]

  if (llmsAssets.includeFull) {
    assets.push({
      fileName: llmsAssets.fullFileName,
      source: generateLlmsFullTxt(entries, config),
    })
  }

  return assets
}

function resolveLlmsConfig(config: ResolvedConfig): ResolvedLlmsConfig {
  const input = typeof config.seo.llms === "object" ? config.seo.llms : {}
  return {
    description: input.description,
    fullFileName: input.fullFileName ?? "llms-full.txt",
    includeFull: input.includeFull ?? true,
    indexFileName: input.indexFileName ?? "llms.txt",
    title: input.title,
  }
}

function getLlmsEntries(entries: RouteManifestEntry[]): LlmsRouteEntry[] {
  return entries.filter(
    (entry): entry is LlmsRouteEntry =>
      entry.source === "markdown" && entry.frontmatter.llms !== false
  )
}

function createHeaderLines(llmsConfig: ResolvedLlmsConfig, config: ResolvedConfig): string[] {
  const title = llmsConfig.title ?? config.title
  const description = llmsConfig.description ?? config.description
  const lines = [`# ${title}`, ""]

  if (description !== "") {
    lines.push(`> ${description}`, "")
  }

  return lines
}

function appendDocsSection(
  lines: string[],
  entries: LlmsRouteEntry[],
  config: ResolvedConfig
): void {
  if (entries.length === 0) {
    return
  }

  lines.push("## Docs", "")
  for (const entry of entries) {
    const title = getEntryTitle(entry)
    const description = entry.frontmatter.description
    const suffix = description == null ? "" : `: ${description}`
    lines.push(`- [${title}](${toAbsolutePublicUrl(entry.publicPath, config)})${suffix}`)
  }
  lines.push("")
}

function appendFullDocSection(
  lines: string[],
  llmsConfig: ResolvedLlmsConfig,
  config: ResolvedConfig
): void {
  if (!llmsConfig.includeFull) {
    return
  }

  lines.push("## More", "")
  lines.push(
    `- [Full documentation](${toAbsoluteUrl(`/${llmsConfig.fullFileName}`, config)}): Complete documentation as one Markdown file.`
  )
  lines.push("")
}

function getEntryTitle(entry: LlmsRouteEntry): string {
  return entry.frontmatter.title ?? formatRouteTitle(entry.routePath)
}

function sanitizeLlmsContent(content: string, title: string): string {
  const withoutMdxSyntax = stripMdxSyntaxOutsideCodeFences(content)
  const withoutDuplicateTitle = removeDuplicateH1(withoutMdxSyntax, title)
  return collapseBlankLines(withoutDuplicateTitle).trim()
}

function removeDuplicateH1(content: string, title: string): string {
  const lines = content.split("\n")
  const firstContentIndex = lines.findIndex((contentLine) => contentLine.trim() !== "")
  if (firstContentIndex === -1) {
    return ""
  }

  const firstContentLine = lines[firstContentIndex]?.trim() ?? ""
  if (!firstContentLine.startsWith("# ")) {
    return content
  }

  const heading = firstContentLine.slice(2).trim()
  if (normalizeHeading(heading) !== normalizeHeading(title)) {
    return content
  }

  lines.splice(firstContentIndex, 1)
  return lines.join("\n")
}

function collapseBlankLines(content: string): string {
  const lines = content.split("\n")
  const collapsed: string[] = []
  let previousWasBlank = false

  for (const line of lines) {
    const isBlank = line.trim() === ""
    if (isBlank && previousWasBlank) {
      continue
    }

    collapsed.push(line.trimEnd())
    previousWasBlank = isBlank
  }

  return collapsed.join("\n")
}

function normalizeHeading(value: string): string {
  return value
    .replaceAll(/[`*_~[\]()]/gu, "")
    .trim()
    .toLowerCase()
}

function formatRouteTitle(routePath: string): string {
  const segment = findLastRouteSegment(routePath)
  const title = segment.replaceAll(/[_-]/g, " ")
  return title.replaceAll(/\b\w/g, (character: string) => character.toUpperCase())
}

function findLastRouteSegment(routePath: string): string {
  const segments = routePath.split("/")
  for (let index = segments.length - 1; index >= 0; index--) {
    const segment = segments[index]
    if (segment !== "") {
      return segment
    }
  }

  return "home"
}

function toAbsoluteUrl(routePath: string, config: ResolvedConfig) {
  const basePath = buildPublicPath({ basePath: config.base, routePath })
  if (config.siteUrl === "") {
    return basePath
  }

  return `${config.siteUrl.replace(/\/$/u, "")}${basePath}`
}

function toAbsolutePublicUrl(publicPath: string, config: ResolvedConfig) {
  if (config.siteUrl === "") {
    return publicPath
  }

  return `${config.siteUrl.replace(/\/$/u, "")}${publicPath}`
}
