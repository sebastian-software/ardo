import path from "node:path"

import type { ResolvedConfig } from "../config/types"

import { toPageMarkdownPath } from "./llms-pages"
import { hasPageMarkdownFiles } from "./llms-text"
import { createRouteManifestOptions, resolveRouteFileIdentity } from "./route-manifest"

/**
 * The URL path of the Markdown file the build writes for a route file, such as
 * `/guide/start.md`, or `undefined` when no such file exists. The page module carries this
 * path so its header can link to the file; the identity comes from the route manifest.
 * The dev server writes no Markdown files, so it names none.
 */
export function resolvePageMarkdownPath(input: {
  command: "build" | "serve" | undefined
  config: ResolvedConfig | undefined
  filePath: string
  routesDir: string
}): string | undefined {
  const { command, config, filePath, routesDir } = input
  if (command !== "build" || config == null || !hasPageMarkdownFiles(config)) return undefined
  const extension = filePath.endsWith(".mdx") ? ".mdx" : filePath.endsWith(".md") ? ".md" : null
  if (extension == null) return undefined
  const relativePath = path.relative(routesDir, filePath)
  if (relativePath.split(path.sep)[0] === ".." || path.isAbsolute(relativePath)) return undefined

  const { identity } = resolveRouteFileIdentity({
    extension,
    filePath,
    options: createRouteManifestOptions(config),
    routesDir,
  })
  return toPageMarkdownPath(identity.publicPath)
}
