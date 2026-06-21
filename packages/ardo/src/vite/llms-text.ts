import type { LlmsConfig, ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

type LlmsRouteEntry = {
  source: "markdown"
} & RouteManifestEntry

type ResolvedLlmsConfig = Pick<LlmsConfig, "description" | "title"> &
  Required<Pick<LlmsConfig, "fullFileName" | "includeFull" | "indexFileName">>

type LlmsTextAsset = {
  fileName: string
  source: string
}

type ComponentTagStripResult = {
  content: string
  isInsideComponentTag: boolean
}

type MdxLineStripResult = {
  content: null | string
  isInsideComponentTag: boolean
}

type ComponentTagScannerState = {
  index: number
  isInsideComponentTag: boolean
  result: string
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
    lines.push(`Source: ${toAbsoluteUrl(entry.path, config)}`, "")
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
    lines.push(`- [${title}](${toAbsoluteUrl(entry.path, config)})${suffix}`)
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
  return entry.frontmatter.title ?? formatRouteTitle(entry.path)
}

function sanitizeLlmsContent(content: string, title: string): string {
  const withoutMdxSyntax = stripMdxSyntaxOutsideCodeFences(content)
  const withoutDuplicateTitle = removeDuplicateH1(withoutMdxSyntax, title)
  return collapseBlankLines(withoutDuplicateTitle).trim()
}

function stripMdxSyntaxOutsideCodeFences(content: string): string {
  const lines: string[] = []
  let isInsideFence = false
  let isInsideComponentTag = false

  for (const line of content.split("\n")) {
    const fenceState = getNextFenceState(line, isInsideFence)
    if (fenceState != null) {
      lines.push(line)
      isInsideFence = fenceState
      continue
    }

    const stripped = stripMdxLine(line, isInsideComponentTag)
    isInsideComponentTag = stripped.isInsideComponentTag
    if (stripped.content !== null) lines.push(stripped.content)
  }

  return lines.join("\n")
}

function getNextFenceState(line: string, isInsideFence: boolean): boolean | null {
  if (line.trimStart().startsWith("```")) {
    return !isInsideFence
  }

  return isInsideFence ? true : null
}

function stripMdxLine(line: string, isInsideComponentTag: boolean): MdxLineStripResult {
  if (isMdxModuleLine(line)) {
    return { content: null, isInsideComponentTag }
  }

  return stripComponentTags(line, isInsideComponentTag)
}

function isMdxModuleLine(line: string): boolean {
  const trimmed = line.trimStart()
  return trimmed.startsWith("import ") || trimmed.startsWith("export ")
}

function stripComponentTags(
  content: string,
  isInsideComponentTag: boolean
): ComponentTagStripResult {
  const state: ComponentTagScannerState = { index: 0, isInsideComponentTag, result: "" }

  while (state.index < content.length) {
    advanceComponentTagScanner(content, state)
  }

  return { content: state.result, isInsideComponentTag: state.isInsideComponentTag }
}

function advanceComponentTagScanner(content: string, state: ComponentTagScannerState): void {
  if (state.isInsideComponentTag) {
    advanceInsideComponentTag(content, state)
    return
  }

  if (isComponentTagStart(content, state.index)) {
    advancePastComponentTag(content, state)
    return
  }

  state.result += content[state.index] ?? ""
  state.index++
}

function advanceInsideComponentTag(content: string, state: ComponentTagScannerState): void {
  const end = content.indexOf(">", state.index)
  if (end === -1) {
    state.index = content.length
    return
  }

  state.index = end + 1
  state.isInsideComponentTag = false
}

function advancePastComponentTag(content: string, state: ComponentTagScannerState): void {
  const end = content.indexOf(">", state.index + 1)
  if (end === -1) {
    state.index = content.length
    state.isInsideComponentTag = true
    return
  }

  state.index = end + 1
}

function isComponentTagStart(content: string, index: number): boolean {
  if (content[index] !== "<") {
    return false
  }

  const next = content.charAt(index + 1)
  if (next === "") {
    return false
  }

  if (isUppercaseAscii(next)) {
    return true
  }

  return next === "/" && isUppercaseAscii(content.charAt(index + 2))
}

function isUppercaseAscii(character: string): boolean {
  return character >= "A" && character <= "Z"
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
