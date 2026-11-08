import type { LlmsConfig, ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { getCurrentVersion } from "../config/versioning"
import { spellPagePath } from "../runtime/trailing-slash"
import { resolveSectionLabel } from "../ui/section-kinds"
import { shiftHeadings } from "./llms-headings"
import { createLlmsBodyRenderer, toPageMarkdownFileName, toPageMarkdownPath } from "./llms-pages"
import { type ReadingOrderEntry, sortByReadingOrder } from "./reading-order"
import { buildPublicPath } from "./route-identity"

type LlmsRouteEntry = {
  source: "markdown"
} & RouteManifestEntry

/** One line of `llms.txt`; a generated reference index counts the pages it stands for. */
type LlmsLink = ReadingOrderEntry<LlmsRouteEntry> & { referencePages?: number }

export type LlmsTextOptions = {
  /**
   * Folders of generated reference pages, relative to the routes directory.
   * `llms.txt` links each one's index instead of every page.
   */
  referenceDirs?: readonly string[]
}

type ResolvedLlmsConfig = Pick<LlmsConfig, "description" | "title"> &
  Required<Pick<LlmsConfig, "fullFileName" | "includeFull" | "indexFileName" | "pages">>

type LlmsTextAsset = {
  fileName: string
  source: string
}

export function generateLlmsTxt(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  options: LlmsTextOptions = {}
): string {
  const llmsConfig = resolveLlmsConfig(config)
  const links = collapseReferences(getLlmsEntries(entries, config), options.referenceDirs)
  const lines = createHeaderLines(llmsConfig, config)
  // With per-page files, each link names the page's Markdown instead of its HTML route.
  const linkUrl = (entry: RouteManifestEntry) =>
    llmsConfig.pages
      ? toAbsolutePublicUrl(toPageMarkdownPath(entry.publicPath), config)
      : toAbsolutePageUrl(entry.publicPath, config)

  appendDocsSections(lines, links, linkUrl)
  appendFullDocSection(lines, llmsConfig, config)

  return `${lines.join("\n").trimEnd()}\n`
}

export function generateLlmsFullTxt(entries: RouteManifestEntry[], config: ResolvedConfig): string {
  const llmsConfig = resolveLlmsConfig(config)
  const lines = createHeaderLines(llmsConfig, config)
  const renderBody = createLlmsBodyRenderer(entries, config)

  for (const { entry } of getLlmsEntries(entries, config)) {
    const title = getEntryTitle(entry)
    const description = entry.metadata.description
    const content = renderBody(entry, title)

    lines.push(`## ${title}`, "")
    if (description != null) {
      lines.push(description, "")
    }
    lines.push(`Source: ${toAbsolutePageUrl(entry.publicPath, config)}`, "")
    if (content.trim() !== "") {
      // The page title is the `##` above, so the page's own headings move one level down.
      lines.push(shiftHeadings(content, 1), "")
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
  config: ResolvedConfig,
  options: LlmsTextOptions = {}
): LlmsTextAsset[] {
  const llmsAssets = getLlmsAssetNames(config)
  const assets = [
    { fileName: llmsAssets.indexFileName, source: generateLlmsTxt(entries, config, options) },
  ]

  if (llmsAssets.includeFull) {
    assets.push({
      fileName: llmsAssets.fullFileName,
      source: generateLlmsFullTxt(entries, config),
    })
  }

  // Page files sit at their own URLs, so versioned indexes link to the same files.
  if (resolveLlmsConfig(config).pages) {
    assets.push(...createLlmsPageAssets(entries, config))
  }

  const version = config.versioning === false ? undefined : getCurrentVersion(config.versioning)
  if (version != null) {
    const versionFolder = version.path.slice(config.deploymentBase.length, -1)
    if (versionFolder !== "") {
      const versionedConfig = { ...config, deploymentBase: version.path }
      assets.push({
        fileName: `${versionFolder}/${llmsAssets.indexFileName}`,
        source: generateLlmsTxt(entries, versionedConfig, options),
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

/**
 * One Markdown file per page: a `#` title, the description, the source URL, then the same body
 * as the page's `llms-full.txt` section. The page's own headings keep their authored levels.
 */
function createLlmsPageAssets(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): LlmsTextAsset[] {
  const renderBody = createLlmsBodyRenderer(entries, config)
  return getLlmsEntries(entries, config).map(({ entry }) => {
    const title = getEntryTitle(entry)
    const description = entry.metadata.description
    const lines = [`# ${title}`, ""]
    if (description != null) {
      lines.push(description, "")
    }
    lines.push(`Source: ${toAbsolutePageUrl(entry.publicPath, config)}`, "")
    const content = renderBody(entry, title)
    if (content.trim() !== "") {
      lines.push(content, "")
    }
    return {
      fileName: toPageMarkdownFileName(entry.publicPath, config.deploymentBase),
      source: `${lines.join("\n").trimEnd()}\n`,
    }
  })
}

/**
 * Whether the build writes a Markdown file for each page. The build runs this only when
 * `seo.llms` is not `false`; a page also needs `llms` not `false` in its frontmatter.
 */
export function hasPageMarkdownFiles(config: ResolvedConfig): boolean {
  return config.seo.llms !== false && resolveLlmsConfig(config).pages
}

function resolveLlmsConfig(config: ResolvedConfig): ResolvedLlmsConfig {
  const input = typeof config.seo.llms === "object" ? config.seo.llms : {}
  return {
    description: input.description,
    fullFileName: input.fullFileName ?? "llms-full.txt",
    includeFull: input.includeFull ?? true,
    indexFileName: input.indexFileName ?? "llms.txt",
    pages: input.pages ?? true,
    title: input.title,
  }
}

/** Exported pages in sidebar order, so a reader meets the guide before the reference. */
function getLlmsEntries(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): Array<ReadingOrderEntry<LlmsRouteEntry>> {
  return sortByReadingOrder(
    entries.filter(
      (entry): entry is LlmsRouteEntry =>
        entry.source === "markdown" && entry.metadata.llms !== false
    ),
    {
      localeIds: config.i18n === false ? undefined : config.i18n.locales.map((locale) => locale.id),
      sectionOrder: config.sidebar.sectionOrder,
    }
  )
}

/** Replaces the pages of each generated reference folder with a link to its index. */
function collapseReferences(
  docs: Array<ReadingOrderEntry<LlmsRouteEntry>>,
  referenceDirs: readonly string[] = []
): LlmsLink[] {
  const dirs = referenceDirs.map((dir) => toPosixSegments(dir)).filter((dir) => dir !== "")
  const referenceDir = (entry: LlmsRouteEntry) => {
    const sourcePath = toPosixSegments(entry.metadata.sourcePath)
    const dir = dirs.find((candidate) => sourcePath.startsWith(`${candidate}/`))
    return dir == null ? undefined : { dir, file: sourcePath.slice(dir.length + 1) }
  }
  const indexes = new Map<string, LlmsLink>()
  for (const doc of docs) {
    const reference = referenceDir(doc.entry)
    if (reference != null && /^index\.mdx?$/u.test(reference.file))
      indexes.set(reference.dir, { ...doc, referencePages: 0 })
  }

  const links: LlmsLink[] = []
  for (const doc of docs) {
    const reference = referenceDir(doc.entry)
    const index = reference == null ? undefined : indexes.get(reference.dir)
    if (index == null) links.push(doc)
    else if (index.entry === doc.entry) links.push(index)
    else index.referencePages = (index.referencePages ?? 0) + 1
  }
  return links
}

function toPosixSegments(value: string): string {
  return value
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".")
    .join("/")
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

/** One `##` list per section tab; pages outside a section folder go under "Docs". */
function appendDocsSections(
  lines: string[],
  links: LlmsLink[],
  linkUrl: (entry: RouteManifestEntry) => string
): void {
  const localized = new Set(links.map((link) => link.localeId)).size > 1
  let currentGroup: string | undefined
  for (const link of links) {
    const group = `${link.localeId ?? ""}/${link.section ?? ""}`
    if (group !== currentGroup) {
      const label = link.section == null ? "Docs" : resolveSectionLabel(link.section)
      if (currentGroup != null) lines.push("")
      lines.push(
        `## ${localized && link.localeId != null ? `${label} (${link.localeId})` : label}`,
        ""
      )
      currentGroup = group
    }
    const { entry } = link
    const description =
      entry.metadata.description ??
      (link.referencePages
        ? `Index of ${link.referencePages} generated reference page${link.referencePages === 1 ? "" : "s"}.`
        : undefined)
    const suffix = description == null ? "" : `: ${description}`
    lines.push(`- [${getEntryTitle(entry)}](${linkUrl(entry)})${suffix}`)
  }
  if (currentGroup != null) lines.push("")
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

/** The page's HTML URL, spelled by the site's `trailingSlash` setting like the sitemap. */
function toAbsolutePageUrl(publicPath: string, config: ResolvedConfig) {
  return toAbsolutePublicUrl(
    spellPagePath(publicPath, config.trailingSlash, config.deploymentBase),
    config
  )
}

function toAbsolutePublicUrl(publicPath: string, config: ResolvedConfig) {
  if (config.siteUrl === "") {
    return publicPath
  }

  return `${config.siteUrl.replace(/\/$/u, "")}${publicPath}`
}
