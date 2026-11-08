import type { Connect, PreviewServer } from "vite"

import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

/**
 * Serve the static output the way static hosts do: `/guide` answers with
 * `guide/index.html`, and unknown paths get the nearest `404.html`. With a `trailingSlash`
 * setting, the other spelling of a page redirects to the configured one, as a configured host
 * would.
 */
export function configureStaticPreview(server: PreviewServer, trailingSlash?: boolean): () => void {
  const outDir = path.resolve(server.config.root, server.config.build.outDir)
  const base = server.config.base

  server.middlewares.use((request, response, next) => {
    const pathname = getRelativePath(request, base)
    const page = pathname?.replace(/\/+$/u, "") ?? ""
    if (page !== "" && isFile(path.join(outDir, page, "index.html"))) {
      const url = new URL(request.url ?? "/", "http://ardo.invalid")
      const slashed = url.pathname.endsWith("/")
      if (trailingSlash != null && slashed !== trailingSlash) {
        response.statusCode = 301
        response.setHeader(
          "Location",
          `${url.pathname.replace(/\/+$/u, "")}${trailingSlash ? "/" : ""}${url.search}`
        )
        response.end()
        return
      }
      if (!slashed) request.url = `${url.pathname}/${url.search}`
    }
    next()
  })

  // Runs after Vite's static file handler and HTML fallback, before it serves HTML.
  return () => {
    server.middlewares.use(createNotFoundHandler(outDir, base))
  }
}

function createNotFoundHandler(outDir: string, base: string): Connect.NextHandleFunction {
  return (request, response, next) => {
    const pathname = getRelativePath(request, base)
    if (pathname == null || (request.method !== "GET" && request.method !== "HEAD")) {
      next()
      return
    }
    // Vite's HTML fallback has already pointed existing pages at their file.
    if (isFile(path.join(outDir, pathname))) {
      next()
      return
    }
    const page = findNotFoundPage(outDir, pathname)
    if (page == null) {
      next()
      return
    }
    response.statusCode = 404
    response.setHeader("Content-Type", "text/html; charset=utf-8")
    response.end(request.method === "HEAD" ? undefined : readFileSync(page))
  }
}

/** The closest `404.html` at or above the requested directory. */
export function findNotFoundPage(outDir: string, pathname: string): string | undefined {
  let directory = path.posix.dirname(`/${pathname}`)
  for (;;) {
    const candidate = path.join(outDir, directory, "404.html")
    if (isFile(candidate)) return candidate
    if (directory === "/") return undefined
    directory = path.posix.dirname(directory)
  }
}

function getRelativePath(request: Connect.IncomingMessage, base: string): string | undefined {
  const url = new URL(request.url ?? "/", "http://ardo.invalid")
  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return undefined
  }
  if (!pathname.startsWith(base) || pathname.includes("..")) return undefined
  return pathname.slice(base.length)
}

function isFile(file: string): boolean {
  return existsSync(file) && statSync(file).isFile()
}
