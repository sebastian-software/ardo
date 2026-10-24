import type { Connect, EnvironmentModuleNode, RunnableDevEnvironment, ViteDevServer } from "vite"

import path from "node:path"

import type { ResolvedConfig } from "../config/types"
import { getVersioningRedirects } from "./build-versioning"

import type { ArdoRenderOptions, ArdoRenderResult } from "../entries/server"

import { VIRTUAL_ENTRY_CLIENT_ID, VIRTUAL_ENTRY_SERVER_ID } from "./routes-plugin"
import { scanRoutesSync } from "./routes-core"

type ServerEntry = {
  renderPage: (path: string, options: ArdoRenderOptions) => Promise<ArdoRenderResult>
}

const CSS_REQUEST = /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss)(?:$|\?)|\.vanilla\.css/u

/**
 * Serve page requests with the same renderer the build uses. Vite then adds its
 * client, React Refresh, and HMR to the document.
 */
export function createDevRenderMiddleware(
  server: ViteDevServer,
  routesDir: string,
  config?: ResolvedConfig
): Connect.NextHandleFunction {
  return (request, response, next) => {
    void handleRequest(server, request, { routesDir, config })
      .then((page) => {
        if (page == null) {
          next()
          return
        }
        response.statusCode = page.status
        if (page.location != null) response.setHeader("Location", page.location)
        response.setHeader("Content-Type", "text/html; charset=utf-8")
        response.end(request.method === "HEAD" ? undefined : page.html)
      })
      .catch((error: unknown) => {
        if (error instanceof Error) server.ssrFixStacktrace(error)
        next(error)
      })
  }
}

async function handleRequest(
  server: ViteDevServer,
  request: Connect.IncomingMessage,
  { routesDir, config }: { routesDir: string; config?: ResolvedConfig }
): Promise<{ html: string; status: number; location?: string } | undefined> {
  const pathname = readRequestPathname(request)
  if (pathname == null) return undefined
  const routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir })
  const redirect =
    config == null
      ? undefined
      : getDevRedirect(
          pathname,
          config,
          routes.map((route) => route.path)
        )
  if (redirect != null) return redirectResponse(request, redirect)
  const pagePath = toPagePath(request, server.config.base, (value) =>
    routes.some((route) => route.path === value.replace(/\/+$/u, ""))
  )
  if (pagePath == null) return undefined

  const base = server.config.base
  const environment = server.environments.ssr as RunnableDevEnvironment
  // The runner loads Ardo's server entry, which has this shape.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const entry = (await environment.runner.import(VIRTUAL_ENTRY_SERVER_ID)) as ServerEntry
  const render = async (pageStylesheets: string[]) =>
    entry.renderPage(pagePath, {
      base,
      assets: () => ({
        entry: `${base}@id/__x00__${VIRTUAL_ENTRY_CLIENT_ID}`,
        modulePreloads: [],
        stylesheets: pageStylesheets,
      }),
    })
  // The first render loads the page's modules; their stylesheets go into the
  // second, so the page does not flash unstyled before the client takes over.
  const first = await render([])
  const stylesheets = collectStylesheets(environment, base)
  const result = stylesheets.length === 0 ? first : await render(stylesheets)
  return {
    html: await injectViteTags(server, request.originalUrl ?? "/", result.html),
    status: result.status,
  }
}

const EMPTY_DOCUMENT = "<!DOCTYPE html><html><head></head><body></body></html>"

/**
 * Add Vite's client and React Refresh to the page. Ardo's HTML already carries
 * the base path, so it does not go through `transformIndexHtml` itself, which
 * would prefix every absolute URL a second time.
 */
async function injectViteTags(server: ViteDevServer, url: string, html: string): Promise<string> {
  const template = await server.transformIndexHtml(url, EMPTY_DOCUMENT)
  const head = /<head>([\s\S]*)<\/head>/u.exec(template)?.[1] ?? ""
  const body = /<body>([\s\S]*)<\/body>/u.exec(template)?.[1] ?? ""
  return html.replace("<head>", () => `<head>${head}`).replace("</body>", () => `${body}</body>`)
}

/** Path of the requested page without the base, or `undefined` for anything that is not a page. */
export function toPagePath(
  request: Pick<Connect.IncomingMessage, "headers" | "method" | "originalUrl" | "url">,
  base: string,
  isPagePath?: (pathname: string) => boolean
): string | undefined {
  const pathname = readRequestPathname(request)
  if (pathname == null) return undefined
  if (pathname.includes("/@") || pathname.includes("/__")) return undefined
  const isBaseRoot = `${pathname}/` === base
  if (!pathname.startsWith(base) && !isBaseRoot) return undefined
  const relative = isBaseRoot ? "" : pathname.slice(base.length)
  const literalPath = `/${relative}`
  const extension = path.posix.extname(pathname)
  if (extension !== "") {
    // A literal route such as guide/index.html.mdx wins over the generated index alias.
    if (isPagePath?.(literalPath)) return literalPath
    if (extension !== ".html") return undefined
  }
  return `/${relative.replace(/(?:^|\/)index\.html$/u, "")}`
}

/** Decode HTML reads once, leaving malformed URLs and non-page requests to Vite. */
function readRequestPathname(
  request: Pick<Connect.IncomingMessage, "headers" | "method" | "originalUrl" | "url">
): string | undefined {
  if (request.method !== "GET" && request.method !== "HEAD") return undefined
  const accept = request.headers.accept ?? ""
  if (accept !== "" && !accept.includes("text/html") && !accept.includes("*/*")) return undefined
  const url = new URL(request.originalUrl ?? request.url ?? "/", "http://ardo.invalid")
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return undefined
  }
}

function collectStylesheets(environment: RunnableDevEnvironment, base: string): string[] {
  const stylesheets: string[] = []
  const visited = new Set<EnvironmentModuleNode>()
  const entry = environment.moduleGraph.getModuleById(`\0${VIRTUAL_ENTRY_SERVER_ID}`)
  const pending = entry == null ? [] : [entry]
  for (let module = pending.pop(); module != null; module = pending.pop()) {
    if (visited.has(module)) continue
    visited.add(module)
    if (module.url !== "" && CSS_REQUEST.test(module.url)) {
      // Module URLs already carry the base path when Vite serves under one.
      const url = module.url.startsWith(base)
        ? module.url
        : `${base}${module.url.replace(/^\//u, "")}`
      stylesheets.push(`${url}${url.includes("?") ? "&" : "?"}direct`)
    }
    pending.push(...module.importedModules)
  }
  return stylesheets
}

/** The same locale migration and root destinations used by the static build. */
export function getDevRedirect(
  pathname: string,
  config: ResolvedConfig,
  routes: string[]
): string | undefined {
  const configured = [...config.redirects, ...getVersioningRedirects(config)].find(
    (redirect) => normalizeRedirectPath(redirect.from) === normalizeRedirectPath(pathname)
  )
  if (configured != null) return configured.to
  if (
    config.i18n === false ||
    config.i18n.redirectUnlocalized !== true ||
    !pathname.startsWith(config.base)
  )
    return
  const relative = `/${pathname.slice(config.base.length)}`
  if (
    normalizeRedirectPath(relative) === "/" ||
    config.i18n.locales.some(({ id }) => id === relative.split("/")[1])
  )
    return
  const target = `/${config.i18n.defaultLocale}${normalizeRedirectPath(relative)}`.replace(
    /\/$/u,
    ""
  )
  if (routes.includes(target)) return `${config.base}${target.slice(1)}/`
}

function redirectResponse(request: Connect.IncomingMessage, redirect: string) {
  const origin = "http://ardo.invalid"
  const target = new URL(redirect, origin)
  const source = new URL(request.originalUrl ?? request.url ?? "/", origin)
  if (target.origin === source.origin && target.search === "") target.search = source.search
  return {
    html: "",
    status: 302,
    location:
      target.origin === origin ? target.pathname + target.search + target.hash : target.href,
  }
}

function normalizeRedirectPath(value: string): string {
  return value.replace(/\/+$/u, "") || "/"
}
