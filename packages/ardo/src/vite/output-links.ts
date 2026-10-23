import { Parser } from "htmlparser2"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

export type OutputLinkCheckOptions = {
  /** Directory that holds the static client build. */
  clientDir: string
  /** Public base path of the site, for example `/` or `/v6/`. */
  base: string
  /** Public URL mounted at the client directory root, including a deployment subpath. */
  deploymentBase?: string
  /** Absolute links to this origin count as internal. */
  siteUrl?: string
  /** Link patterns to skip. A single `*` matches any infix. */
  exclude?: string[]
  /** Verify `#fragment` targets against element ids. Defaults to true. */
  checkAnchors?: boolean
}

export type OutputLinkDiagnostic = {
  /** Page that contains the link, relative to the client directory. */
  file: string
  href: string
  message: string
}

export type OutputLinkCheckResult = {
  pages: number
  links: number
  diagnostics: OutputLinkDiagnostic[]
}

type PageLinks = { ids: Set<string>; links: string[] }

type Site = {
  base: string
  checkAnchors: boolean
  exclude: string[]
  files: Set<string>
  /** URL path that corresponds to the client directory root. */
  mount: string
  pages: Map<string, PageLinks>
  redirects: Set<string>
  siteOrigin: string | undefined
}

type ResolvedTarget = { file: string } | { redirect: true } | { missing: true }

const LOCAL_ORIGIN = "http://ardo.invalid"

const URL_ATTRIBUTES: Record<string, readonly string[]> = {
  a: ["href"],
  area: ["href"],
  audio: ["src"],
  embed: ["src"],
  iframe: ["src"],
  img: ["src", "srcset"],
  input: ["src"],
  link: ["href"],
  script: ["src"],
  source: ["src", "srcset"],
  track: ["src"],
  video: ["src", "poster"],
}

/** Resource hints name origins, not documents. */
const SKIPPED_LINK_RELS = new Set(["dns-prefetch", "preconnect"])

/**
 * Check every internal link and resource reference in a static build output.
 * External URLs are out of scope: their availability depends on third parties,
 * not on the build.
 */
export function checkOutputLinks(options: OutputLinkCheckOptions): OutputLinkCheckResult {
  const site = readSite(options)
  let links = 0
  const diagnostics: OutputLinkDiagnostic[] = []
  for (const [file, page] of site.pages) {
    links += page.links.length
    diagnostics.push(...checkPage(site, file, page))
  }
  return { pages: site.pages.size, links, diagnostics }
}

function readSite(options: OutputLinkCheckOptions): Site {
  const base = normalizeBase(options.base)
  const files = listFiles(options.clientDir)
  const pages = new Map<string, PageLinks>()
  for (const file of files) {
    if (file.endsWith(".html")) {
      pages.set(file, parsePage(readFileSync(path.join(options.clientDir, file), "utf8")))
    }
  }
  return {
    base,
    checkAnchors: options.checkAnchors !== false,
    exclude: options.exclude ?? [],
    files,
    mount:
      options.deploymentBase == null
        ? files.has(joinPath(base.slice(1), "index.html"))
          ? "/"
          : base
        : normalizeBase(options.deploymentBase),
    pages,
    redirects: readRedirects(options.clientDir),
    siteOrigin: parseOrigin(options.siteUrl),
  }
}

/** Report each broken href once per page. */
function checkPage(site: Site, file: string, page: PageLinks): OutputLinkDiagnostic[] {
  const diagnostics: OutputLinkDiagnostic[] = []
  for (const href of new Set(page.links)) {
    const message = checkLink(site, file, href)
    if (message != null) diagnostics.push({ file, href, message })
  }
  return diagnostics
}

export function formatOutputLinkDiagnostics(diagnostics: OutputLinkDiagnostic[]): string {
  const byFile = new Map<string, OutputLinkDiagnostic[]>()
  for (const diagnostic of diagnostics) {
    const entries = byFile.get(diagnostic.file) ?? []
    entries.push(diagnostic)
    byFile.set(diagnostic.file, entries)
  }
  const lines: string[] = []
  for (const [file, entries] of byFile) {
    lines.push(`  ${file}`)
    for (const entry of entries) lines.push(`    ${entry.href}: ${entry.message}`)
  }
  return lines.join("\n")
}

function checkLink(site: Site, file: string, href: string): string | undefined {
  const pageUrl = site.mount + toPagePath(file)
  let url: URL
  try {
    url = new URL(href, LOCAL_ORIGIN + pageUrl)
  } catch {
    return "Invalid URL"
  }
  if (url.origin !== LOCAL_ORIGIN && url.origin !== site.siteOrigin) return undefined

  const pathname = safeDecode(url.pathname)
  // Other deployments may share the host (archived versions, separate apps), but
  // this build cannot know their contents.
  if (!isInsideBase(pathname, site.base)) return undefined
  if (isExcluded(site, href, pathname)) return undefined

  const target = resolveTarget(site, pathname)
  if ("missing" in target) return "Missing target"
  if ("redirect" in target) return undefined
  return checkAnchor(site, target.file, url.hash)
}

function checkAnchor(site: Site, file: string, hash: string): string | undefined {
  if (!site.checkAnchors || hash.length <= 1) return undefined
  const fragment = safeDecode(hash.slice(1))
  // Text fragments and the implicit top-of-document target need no element.
  if (fragment.startsWith(":~:") || fragment.toLowerCase() === "top") return undefined
  const page = site.pages.get(file)
  if (page == null || page.ids.has(fragment)) return undefined
  return `Missing anchor "#${fragment}"`
}

function resolveTarget(site: Site, pathname: string): ResolvedTarget {
  const relative = pathname.length <= site.mount.length ? "" : pathname.slice(site.mount.length)
  const candidates =
    relative === "" || relative.endsWith("/")
      ? [joinPath(relative, "index.html")]
      : [relative, joinPath(relative, "index.html"), `${relative}.html`]
  const file = candidates.find((candidate) => site.files.has(candidate))
  if (file != null) return { file }
  if (site.redirects.has(trimTrailingSlash(pathname))) return { redirect: true }
  return { missing: true }
}

function isExcluded(site: Site, href: string, pathname: string): boolean {
  if (site.exclude.length === 0) return false
  // Patterns predate base-aware checking, so they may omit the base path.
  const withoutBase = `/${pathname.slice(site.base.length)}`
  return site.exclude.some(
    (pattern) =>
      matchesPattern(href, pattern) ||
      matchesPattern(pathname, pattern) ||
      matchesPattern(withoutBase, pattern)
  )
}

function matchesPattern(value: string, pattern: string): boolean {
  if (!pattern.includes("*")) return value === pattern
  const [prefix = "", suffix = ""] = pattern.split("*")
  return value.startsWith(prefix) && value.endsWith(suffix)
}

function parsePage(html: string): PageLinks {
  const ids = new Set<string>()
  const links: string[] = []
  const parser = new Parser(
    {
      onopentag(name, attributes) {
        if (attributes.id != null) ids.add(attributes.id)
        if (name === "a" && attributes.name != null) ids.add(attributes.name)
        collectUrls(name, attributes, links)
      },
    },
    { decodeEntities: true, lowerCaseAttributeNames: true, lowerCaseTags: true }
  )
  parser.write(html)
  parser.end()
  return { ids, links }
}

function collectUrls(name: string, attributes: Record<string, string>, links: string[]): void {
  const names = URL_ATTRIBUTES[name]
  if (names == null) return
  if (name === "link" && isResourceHint(attributes.rel)) return
  if (name === "input" && attributes.type?.toLowerCase() !== "image") return
  for (const attribute of names) {
    const value = attributes[attribute]?.trim()
    if (value == null || value === "") continue
    if (attribute === "srcset") links.push(...parseSrcset(value))
    else links.push(value)
  }
}

function isResourceHint(rel: string | undefined): boolean {
  return (rel ?? "")
    .toLowerCase()
    .split(/\s+/u)
    .some((token) => SKIPPED_LINK_RELS.has(token))
}

function parseSrcset(value: string): string[] {
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/u)[0] ?? "")
    .filter((candidate) => candidate !== "")
}

function readRedirects(clientDir: string): Set<string> {
  const file = path.join(clientDir, "_redirects")
  const redirects = new Set<string>()
  if (!existsSync(file)) return redirects
  for (const line of readFileSync(file, "utf8").split(/\r?\n/u)) {
    const from = line.trim().split(/\s+/u)[0]
    if (from == null || from === "" || from.startsWith("#")) continue
    redirects.add(trimTrailingSlash(from))
  }
  return redirects
}

function listFiles(root: string): Set<string> {
  const entries = readdirSync(root, { recursive: true, withFileTypes: true })
  const files = new Set<string>()
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const absolute = path.join(entry.parentPath, entry.name)
    files.add(path.relative(root, absolute).split(path.sep).join("/"))
  }
  return files
}

/** URL path of a page relative to the mount, as the browser sees it. */
function toPagePath(file: string): string {
  if (file === "index.html") return ""
  if (file.endsWith("/index.html")) return file.slice(0, -"index.html".length)
  return file
}

function isInsideBase(pathname: string, base: string): boolean {
  return pathname.startsWith(base) || `${pathname}/` === base
}

function normalizeBase(base: string): string {
  const trimmed = base.trim()
  if (trimmed === "" || trimmed === "/") return "/"
  return `/${trimmed.replaceAll(/^\/+|\/+$/gu, "")}/`
}

function parseOrigin(siteUrl: string | undefined): string | undefined {
  if (siteUrl == null || siteUrl === "") return undefined
  try {
    return new URL(siteUrl).origin
  } catch {
    return undefined
  }
}

function joinPath(directory: string, file: string): string {
  return directory === "" ? file : `${directory.replace(/\/$/u, "")}/${file}`
}

function trimTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/u, "") : value
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
