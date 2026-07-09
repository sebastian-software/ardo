import type { Plugin } from "vite"

import path from "node:path"

import type { ContentSourceMapping } from "./content-sources"

import { materializeContentSources } from "./content-sources"
import { runArdoLifecyclePhase } from "./lifecycle"
import { resolveRoutesDir } from "./path-utils"
import { writeRoutesFile } from "./routes-core"

export function createContentSourcePlugin(
  sources: ContentSourceMapping[],
  options: { root: string; routesDirOption: string | undefined }
): Plugin {
  let root = options.root
  let routesDir = resolveRoutesDir(root, options.routesDirOption)
  let didMaterializeDuringConfig = false
  let queuedMaterialization: Promise<void> = Promise.resolve()

  async function materializeAndWriteRoutes(): Promise<void> {
    await runArdoLifecyclePhase("content-sources:materialize", async () =>
      materializeContentSources({ root, routesDir, sources })
    )
    await runArdoLifecyclePhase("routes:generate", async () =>
      writeRoutesFile({
        appDir: path.resolve(root, "app"),
        routesDir,
        routesFilePath: path.resolve(root, "app/routes.ts"),
      })
    )
  }

  function queueMaterializeAndWriteRoutes(onError: (error: unknown) => void): void {
    queuedMaterialization = queuedMaterialization
      .catch(() => {
        // Keep later watcher events from being pinned behind an earlier failure.
      })
      .then(async () => {
        await materializeAndWriteRoutes()
      })
    void queuedMaterialization.catch(onError)
  }

  return {
    name: "ardo:content-sources",
    enforce: "pre",
    async config(userConfig) {
      root = userConfig.root ?? root
      routesDir = resolveRoutesDir(root, options.routesDirOption)
      await materializeAndWriteRoutes()
      didMaterializeDuringConfig = true
    },
    configResolved(config) {
      root = config.root
      routesDir = resolveRoutesDir(root, options.routesDirOption)
    },
    async buildStart() {
      if (didMaterializeDuringConfig) {
        didMaterializeDuringConfig = false
        return
      }
      await materializeAndWriteRoutes()
    },
    configureServer(server) {
      for (const source of sources) {
        server.watcher.add(path.resolve(root, source.from))
      }

      const handleChange = (changedPath: string) => {
        if (shouldHandleSourceChange(changedPath, root, sources)) {
          queueMaterializeAndWriteRoutes((error) => {
            server.config.logger.error(
              `[ardo] Failed to materialize content sources: ${formatUnknownError(error)}`
            )
          })
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

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
