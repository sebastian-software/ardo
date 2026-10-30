import path from "node:path"
import type { Connect, ViteDevServer } from "vite"
import { isInside, refreshPublication, type PublicationBuilder } from "./publication-materialize"
import {
  coordinatePublicationRequests,
  invalidatePublicationModules,
} from "./publication-dev-cache"

export function configurePublicationDev(server: ViteDevServer, builder: PublicationBuilder): void {
  const config = builder.site.resolvedConfig
  if (config == null) return
  const waitForRequests = coordinatePublicationRequests(server, builder)
  server.watcher.add(path.resolve(config.root, builder.options.from))
  watchImages(server, builder)
  const changed = (file: string) => {
    if (
      !isInside(file, path.resolve(config.root, builder.options.from)) &&
      !builder.prepared.some((entry) => entry.dependencies.has(file))
    )
      return
    builder.queue = builder.queue
      .catch(() => {
        // The previous error was reported; later source changes must still rebuild.
      })
      .then(async () => {
        await waitForRequests()
        await refreshPublication(builder)
        watchImages(server, builder)
        invalidatePublicationModules(server, builder)
        server.ws.send({ type: "full-reload" })
      })
    void builder.queue.catch((error: unknown) => reportDevError(server, error))
  }
  server.watcher.on("add", changed)
  server.watcher.on("change", changed)
  server.watcher.on("unlink", changed)
  server.middlewares.use(createAssetMiddleware(builder))
}

function reportDevError(server: ViteDevServer, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  server.config.logger.error(message)
  server.ws.send({ type: "error", err: { message, stack: "" } })
}
function watchImages(server: ViteDevServer, builder: PublicationBuilder): void {
  for (const entry of builder.prepared) server.watcher.add([...entry.dependencies])
}

function createAssetMiddleware(builder: PublicationBuilder): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (request.method !== "GET" && request.method !== "HEAD") return next()
    const config = builder.site.resolvedConfig
    if (config == null) return next()
    const url = new URL(request.originalUrl ?? request.url ?? "/", "http://ardo.invalid").pathname
    if (!url.startsWith(config.deploymentBase)) return next()
    const name = url.slice(config.deploymentBase.length)
    const image = builder.prepared
      .map((entry) => entry.assets.get(name))
      .find((entry) => entry != null)
    const feed = builder.prepared
      .flatMap((entry) => entry.feeds)
      .find((entry) => entry.fileName === name)
    const asset = image ?? feed
    if (asset == null) return next()
    response.setHeader("Content-Type", contentType(name))
    response.end(request.method === "HEAD" ? undefined : asset.source)
  }
}

function contentType(name: string): string {
  if (name.endsWith("atom.xml")) return "application/atom+xml; charset=utf-8"
  if (name.endsWith("rss.xml")) return "application/rss+xml; charset=utf-8"
  const types: Record<string, string> = {
    ".svg": "image/svg+xml",
    ".gif": "image/gif",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  }
  return types[path.extname(name)] ?? "application/octet-stream"
}
