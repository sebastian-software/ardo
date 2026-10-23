import type { LlmsConfig, ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { getCurrentVersion } from "../config/versioning"
import { resolveLlmsContentLinks } from "./llms-links"
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
  const routePaths = new Set(entries.map((entry) => entry.routePath))

  for (const entry of getLlmsEntries(entries)) {
    const title = getEntryTitle(entry)
    const description = entry.metadata.description
    const content = stripMdxSyntaxOutsideCodeFences(
      resolveLlmsContentLinks(entry.content, { ...entry, routePaths }, config),
      title
    )

    lines.push(`## ${title}`, "")
    if (description != null) {
      lines.push(description, "")
    }
    lines.push(`Source: ${toAbsolutePublicUrl(entry.publicPath, config)}`, "")
    if (content.trim() !== "") {
      lines.push(content, "")
    }
  }

  return `${lines.join("\n")}\n`
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

  const version = config.versioning === false ? undefined : getCurrentVersion(config.versioning)
  if (version != null) {
    const versionFolder = version.path.slice(config.deploymentBase.length, -1)
    if (versionFolder !== "") {
      const versionedConfig = { ...config, deploymentBase: version.path }
      assets.push({
        fileName: `${versionFolder}/${llmsAssets.indexFileName}`,
        source: generateLlmsTxt(entries, versionedConfig),
      })
      if (llmsAssets.includeFull) {
        assets.push({
          fileName: `${versionFolder}/${llmsAssets.fullFileName}`,
          source: generateLlmsFullTxt(entries, versionedConfig),
        })
      }
    }
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
    (entry): entry is LlmsRouteEntry => entry.source === "markdown" && entry.metadata.llms !== false
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
    const description = entry.metadata.description
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
  return entry.metadata.title ?? formatRouteTitle(entry.routePath)
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
  const basePath = buildPublicPath({ basePath: config.deploymentBase, routePath })
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
