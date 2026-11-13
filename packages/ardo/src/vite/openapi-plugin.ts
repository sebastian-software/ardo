import path from "node:path"
import type { Plugin } from "vite"

import type { OpenApiConfig } from "../config/types"

import { generateOpenApiDocs } from "./openapi"
import { resolveRoutesDir } from "./path-utils"

export function createOpenApiPlugin(
  config: OpenApiConfig,
  routesDirOption: string | undefined
): Plugin {
  let root = process.cwd()
  let generated = false
  return {
    name: "ardo:openapi",
    async config(userConfig, env) {
      root = userConfig.root ?? root
      // Preview serves an existing build and must not rewrite its sources.
      if (env.isSsrBuild || env.isPreview || generated) return
      generated = true
      const routesDir = resolveRoutesDir(root, routesDirOption)
      await generateOpenApiDocs({ config, root, routesDir })
    },
    configureServer(server) {
      const specPath = path.resolve(root, config.spec)
      const routesDir = resolveRoutesDir(root, routesDirOption)
      let queue = Promise.resolve()
      server.watcher.add(specPath)
      server.watcher.on("change", (file) => {
        if (path.resolve(file) !== specPath) return
        queue = queue.then(async () => {
          try {
            await generateOpenApiDocs({ config, incremental: true, root, routesDir })
          } catch (error) {
            server.config.logger.error(
              `[ardo] OpenAPI reference regeneration failed: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        })
      })
    },
  }
}
