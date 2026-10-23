import { check, type Issue } from "ferrolink"
import { existsSync } from "node:fs"
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
  /** Link targets to skip. A single `*` matches any infix. */
  exclude?: string[]
  /** Verify `#fragment` targets against element ids. Defaults to true. */
  checkAnchors?: boolean
  /**
   * Public paths of other deployments on the same host, such as archived
   * documentation versions. Links into them count as present.
   */
  externalPaths?: string[]
}

export type OutputLinkDiagnostic = {
  /** Page or deployment file that contains the link, relative to the client directory. */
  file: string
  /** One-based line of the link; `0` when unknown. */
  line: number
  href: string
  message: string
}

export type OutputLinkCheckResult = {
  pages: number
  links: number
  diagnostics: OutputLinkDiagnostic[]
}

/**
 * Check every internal link, resource reference, and `#fragment` in a static
 * build output with ferrolink, including the redirect and version files at
 * its root. External URLs are out of scope: their availability depends on
 * third parties, not on the build.
 */
export async function checkOutputLinks(
  options: OutputLinkCheckOptions
): Promise<OutputLinkCheckResult> {
  const base = normalizeBase(options.base)
  const mount = resolveMount(options.clientDir, base, options.deploymentBase)
  const report = await check({
    root: options.clientDir,
    basePath: mount,
    anchors: options.checkAnchors !== false,
    assumePresent: toMountGlobs(options.externalPaths ?? [], mount),
    ...(options.siteUrl == null || options.siteUrl === "" ? {} : { siteUrl: options.siteUrl }),
  })
  const exclude = options.exclude ?? []
  const diagnostics = report.issues
    .filter((issue) => !isExcluded(exclude, base, issue))
    .map((issue) => ({
      file: issue.source,
      line: issue.line,
      href: issue.href,
      message: describeIssue(issue, mount),
    }))
  return { pages: report.summary.pages, links: report.summary.internalLinks, diagnostics }
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
    for (const entry of entries) {
      const location = entry.line === 0 ? "" : ` (line ${entry.line})`
      lines.push(`    ${entry.href}${location}: ${entry.message}`)
    }
  }
  return lines.join("\n")
}

/** URL path that corresponds to the client directory root. */
function resolveMount(clientDir: string, base: string, deploymentBase: string | undefined) {
  if (deploymentBase != null) return normalizeBase(deploymentBase)
  // A build that keeps its base folder is served from the host root.
  return existsSync(path.join(clientDir, base.slice(1), "index.html")) ? "/" : base
}

/** ferrolink globs, relative to the mount, for public paths below it. */
function toMountGlobs(paths: string[], mount: string): string[] {
  return paths
    .map((publicPath) => normalizeBase(publicPath))
    .filter((publicPath) => publicPath.startsWith(mount) && publicPath !== mount)
    .map((publicPath) => `${publicPath.slice(mount.length)}**`)
}

function describeIssue(issue: Issue, mount: string): string {
  switch (issue.kind) {
    case "broken_link": {
      return "Missing target"
    }
    case "missing_anchor": {
      const fragment = issue.target.slice(issue.target.indexOf("#") + 1)
      return `Missing anchor "#${safeDecode(fragment)}"`
    }
    case "outside_base": {
      return `Outside the deployment base ${mount}`
    }
    default: {
      return issue.kind
    }
  }
}

function isExcluded(patterns: string[], base: string, issue: Issue): boolean {
  if (patterns.length === 0) return false
  const pathname = safeDecode(issue.target.split("#")[0] ?? "")
  // Patterns predate base-aware checking, so they may omit the base path.
  const withoutBase = pathname.startsWith(base) ? `/${pathname.slice(base.length)}` : pathname
  return patterns.some(
    (pattern) =>
      matchesPattern(issue.href, pattern) ||
      matchesPattern(pathname, pattern) ||
      matchesPattern(withoutBase, pattern)
  )
}

function matchesPattern(value: string, pattern: string): boolean {
  if (!pattern.includes("*")) return value === pattern
  const [prefix = "", suffix = ""] = pattern.split("*")
  return value.startsWith(prefix) && value.endsWith(suffix)
}

function normalizeBase(base: string): string {
  const trimmed = base.trim()
  if (trimmed === "" || trimmed === "/") return "/"
  return `/${trimmed.replaceAll(/^\/+|\/+$/gu, "")}/`
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
