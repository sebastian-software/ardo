import type { Plugin } from "vite"

import path from "node:path"

import type { OpenApiConfig } from "../config/types"

import { generateOpenApiDocs } from "./openapi"
import { resolveRoutesDir } from "./path-utils"
import { writeRoutesFileSync } from "./routes-core"

export function createOpenApiPlugin(
  config: OpenApiConfig,
  routesDirOption: string | undefined
): Plugin {
  let root = process.cwd()
  let generated = false
  return {
    name: "ardo:openapi",
    async config(userConfig) {
      root = userConfig.root ?? root
      if (generated) return
      generated = true
      const routesDir = resolveRoutesDir(root, routesDirOption)
      await generateOpenApiDocs({ config, root, routesDir })
      writeRoutesFileSync({
        appDir: path.join(root, "app"),
        routesDir,
        routesFilePath: path.join(root, "app", "routes.ts"),
      })
    },
    buildEnd() {
      generated = false
    },
  }
}
