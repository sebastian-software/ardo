import type { Connect, PreviewServer } from "vite"

import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

/**
 * Serve the static output the way static hosts do: `/guide` answers with
 * `guide/index.html`, and unknown paths get the nearest `404.html`.
 */
export function configureStaticPreview(server: PreviewServer): () => void {
  const outDir = path.resolve(server.config.root, server.config.build.outDir)
  const base = server.config.base

  server.middlewares.use((request, _response, next) => {
    const pathname = getRelativePath(request, base)
    if (pathname != null && !pathname.endsWith("/")) {
      if (isFile(path.join(outDir, pathname, "index.html"))) {
        const url = new URL(request.url ?? "/", "http://ardo.invalid")
        request.url = `${url.pathname}/${url.search}`
      }
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
