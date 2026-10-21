import type { Logger } from "vite"

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { ArdoRenderAssets, ArdoRenderOptions, ArdoRenderResult } from "../entries/server"
import type { LinkCheckConfig } from "../config/types"

import { checkOutputLinks, formatOutputLinkDiagnostics } from "./output-links"

type ManifestChunk = {
  css?: string[]
  file: string
  imports?: string[]
  isDynamicEntry?: boolean
  isEntry?: boolean
}

type ServerEntry = {
  getStaticPaths: () => string[]
  renderPage: (path: string, options: ArdoRenderOptions) => Promise<ArdoRenderResult>
}

const MANIFEST_FILE = ".vite/manifest.json"
const RENDER_CONCURRENCY = 8

/** Map a route to the client entry, stylesheets, and chunks its page needs. */
export function createAssetResolver(
  manifest: Record<string, ManifestChunk>,
  base: string
): (routeId: string | undefined) => ArdoRenderAssets {
  const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry === true)
  const entryChunk = entryKey == null ? undefined : manifest[entryKey]
  if (entryKey == null || entryChunk == null) {
    throw new Error("[ardo] The client build has no entry chunk.")
  }
  const shared = collectChunks(manifest, [entryKey])
  const url = (file: string) => `${base}${file}`

  return (routeId) => {
    const page = collectChunks(manifest, routeId == null ? [] : [routeId], shared.visited)
    return {
      entry: url(entryChunk.file),
      modulePreloads: [...shared.files, ...page.files]
        .filter((file) => file !== entryChunk.file)
        .map((file) => url(file)),
      stylesheets: [...shared.css, ...page.css].map((file) => url(file)),
    }
  }
}

function collectChunks(
  manifest: Record<string, ManifestChunk>,
  keys: string[],
  skip: ReadonlySet<string> = new Set()
): { css: Set<string>; files: Set<string>; visited: Set<string> } {
  const css = new Set<string>()
  const files = new Set<string>()
  const visited = new Set<string>()
  const pending = [...keys]
  for (let key = pending.pop(); key != null; key = pending.pop()) {
    const chunk = manifest[key]
    if (chunk == null || visited.has(key) || skip.has(key)) continue
    visited.add(key)
    files.add(chunk.file)
    for (const file of chunk.css ?? []) css.add(file)
    pending.push(...(chunk.imports ?? []))
  }
  return { css, files, visited }
}

/** Where pages live inside the client directory: the base path below the deployment root. */
export function resolvePageDirectory(clientDir: string, base: string, deploymentBase: string) {
  const relative = trimSlashes(base).slice(trimSlashes(deploymentBase).length)
  return path.join(clientDir, trimSlashes(relative))
}

function trimSlashes(value: string): string {
  return value.replaceAll(/^\/+|\/+$/gu, "")
}

/** HTML file of a page path inside the page directory. */
export function toHtmlFile(pagePath: string): string {
  const trimmed = pagePath.replaceAll(/^\/+|\/+$/gu, "")
  return trimmed === "" ? "index.html" : `${trimmed}/index.html`
}

/**
 * Render every static route of the built site into HTML files. Assets move
 * below the base path first, so the output mirrors the deployed URL space.
 */
export async function prerenderSite(options: {
  base: string
  clientDir: string
  deploymentBase: string
  logger: Logger
  serverEntry: string
}): Promise<number> {
  const { base, clientDir, logger } = options
  const manifestPath = path.join(clientDir, MANIFEST_FILE)
  // Vite writes this file in the documented manifest shape.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, ManifestChunk>
  const assets = createAssetResolver(manifest, base)
  const pageDir = resolvePageDirectory(clientDir, base, options.deploymentBase)
  moveAssets(clientDir, pageDir)

  // The server build is plain ESM that Vite just wrote.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const server = (await import(pathToFileURL(options.serverEntry).href)) as ServerEntry
  const paths = server.getStaticPaths()
  const write = async (pagePath: string, notFound = false) => {
    const result = await server.renderPage(pagePath, { assets, base, notFound })
    const file = path.join(pageDir, notFound ? "404.html" : toHtmlFile(pagePath))
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, result.html)
  }

  for (let index = 0; index < paths.length; index += RENDER_CONCURRENCY) {
    await Promise.all(paths.slice(index, index + RENDER_CONCURRENCY).map(async (p) => write(p)))
  }
  await write("/404", true)
  rmSync(path.dirname(manifestPath), { recursive: true, force: true })
  logger.info(`[ardo] Prerendered ${paths.length} pages`)
  return paths.length
}

/** Check internal links in the written site. Throws when `level` is `error`. */
export function checkSiteLinks(options: {
  base: string
  clientDir: string
  linkCheck: LinkCheckConfig
  logger: Logger
  siteUrl?: string
}): void {
  const { linkCheck, logger } = options
  if (linkCheck.enabled === false) return
  const result = checkOutputLinks({
    base: options.base,
    checkAnchors: linkCheck.checkAnchors,
    clientDir: options.clientDir,
    exclude: linkCheck.exclude,
    siteUrl: options.siteUrl,
  })
  const checked = `${result.links} internal links in ${result.pages} pages`
  if (result.diagnostics.length === 0) {
    logger.info(`[ardo] Checked ${checked}`)
    return
  }
  const count = result.diagnostics.length
  const message = `[ardo] ${count} broken internal link${count === 1 ? "" : "s"} in build output (${checked}):\n${formatOutputLinkDiagnostics(result.diagnostics)}`
  if (linkCheck.level === "error") throw new Error(message)
  logger.warn(message)
}

function moveAssets(clientDir: string, pageDir: string): void {
  const source = path.join(clientDir, "assets")
  if (pageDir === clientDir || !existsSync(source)) return
  const target = path.join(pageDir, "assets")
  mkdirSync(pageDir, { recursive: true })
  rmSync(target, { recursive: true, force: true })
  renameSync(source, target)
}
