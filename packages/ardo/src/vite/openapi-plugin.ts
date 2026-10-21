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
      if (env.isSsrBuild || generated) return
      generated = true
      const routesDir = resolveRoutesDir(root, routesDirOption)
      await generateOpenApiDocs({ config, root, routesDir })
    },
  }
}
