import type { Plugin } from "vite"

import path from "node:path"

import { writeRoutesFile, writeRoutesFileSync } from "./routes-core"

export interface ArdoRoutesPluginOptions {
  /** Directory where routes are located (default: "./app/routes") */
  routesDir?: string
}

interface ResolvedRoutePaths {
  appDir: string
  routesDir: string
  routesFilePath: string
}

/**
 * Vite plugin that generates routes.ts for React Router Framework Mode.
 */
export function ardoRoutesPlugin(options: ArdoRoutesPluginOptions = {}): Plugin {
  let paths = createDefaultPaths(process.cwd(), options)

  return {
    name: "ardo:routes",
    enforce: "pre",

    config(userConfig) {
      const root = userConfig.root ?? process.cwd()
      paths = createDefaultPaths(root, options)

      try {
        writeRoutesFileSync(paths)
      } catch (error) {
        console.warn("[ardo] Could not generate routes.ts in config phase:", error)
      }
    },

    configResolved(resolvedConfig) {
      paths = createDefaultPaths(resolvedConfig.root, options)
    },

    async buildStart() {
      await writeRoutesFile(paths)
    },

    configureServer(server) {
      server.watcher.add(paths.routesDir)

      const handleChange = (changedPath: string) => {
        if (shouldHandleRouteChange(changedPath, paths.routesDir)) {
          void writeRoutesFile(paths)
        }
      }

      server.watcher.on("add", handleChange)
      server.watcher.on("unlink", handleChange)
    },
  }
}

function createDefaultPaths(root: string, options: ArdoRoutesPluginOptions): ResolvedRoutePaths {
  const appDir = path.join(root, "app")
  const routesDir = options.routesDir ?? path.join(appDir, "routes")
  const routesFilePath = path.join(appDir, "routes.ts")
  return { appDir, routesDir, routesFilePath }
}

function shouldHandleRouteChange(changedPath: string, routesDir: string): boolean {
  if (!changedPath.startsWith(routesDir)) {
    return false
  }

  return changedPath.endsWith(".md") || changedPath.endsWith(".mdx") || changedPath.endsWith(".tsx")
}
