import type { Plugin } from "vite"

import path from "node:path"

import type { ContentSourceMapping } from "./content-sources"

import { materializeContentSources } from "./content-sources"
import { resolveRoutesDir } from "./path-utils"
import { writeRoutesFile } from "./routes-core"

export function createContentSourcePlugin(
  sources: ContentSourceMapping[],
  options: { root: string; routesDirOption: string | undefined }
): Plugin {
  let root = options.root
  let routesDir = resolveRoutesDir(root, options.routesDirOption)

  async function materializeAndWriteRoutes(): Promise<void> {
    await materializeContentSources({ root, routesDir, sources })
    await writeRoutesFile({
      appDir: path.resolve(root, "app"),
      routesDir,
      routesFilePath: path.resolve(root, "app/routes.ts"),
    })
  }

  return {
    name: "ardo:content-sources",
    enforce: "pre",
    async config(userConfig) {
      root = userConfig.root ?? root
      routesDir = resolveRoutesDir(root, options.routesDirOption)
      await materializeAndWriteRoutes()
    },
    configResolved(config) {
      root = config.root
      routesDir = resolveRoutesDir(root, options.routesDirOption)
    },
    async buildStart() {
      await materializeAndWriteRoutes()
    },
    configureServer(server) {
      for (const source of sources) {
        server.watcher.add(path.resolve(root, source.from))
      }

      const handleChange = (changedPath: string) => {
        if (shouldHandleSourceChange(changedPath, root, sources)) {
          void materializeAndWriteRoutes()
        }
      }

      server.watcher.on("add", handleChange)
      server.watcher.on("change", handleChange)
      server.watcher.on("unlink", handleChange)
    },
  }
}

function shouldHandleSourceChange(
  changedPath: string,
  root: string,
  sources: ContentSourceMapping[]
): boolean {
  if (!isMarkdownFile(changedPath)) {
    return false
  }

  return sources.some((source) => isPathInside(changedPath, path.resolve(root, source.from)))
}

function isPathInside(filePath: string, directoryPath: string): boolean {
  const relativePath = path.relative(directoryPath, filePath)
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
}

function isMarkdownFile(filePath: string): boolean {
  return filePath.endsWith(".md") || filePath.endsWith(".mdx")
}
