import type { Plugin } from "vite"

import type { TypeDocConfig } from "../typedoc/types"

import { generateApiDocs } from "../typedoc/generator"
import { findPackageRoot } from "./git-utils"

let typedocGenerated = false

export function resolveTypedocConfig(
  typedoc: true | TypeDocConfig | undefined
): TypeDocConfig | undefined {
  if (typedoc == null) {
    return undefined
  }

  const packageRoot = findPackageRoot(process.cwd())
  const defaultEntryPoint = packageRoot != null ? `${packageRoot}/src/index.ts` : "./src/index.ts"
  const defaultTsconfig = packageRoot != null ? `${packageRoot}/tsconfig.json` : "./tsconfig.json"
  const defaults: TypeDocConfig = {
    enabled: true,
    entryPoints: [defaultEntryPoint],
    tsconfig: defaultTsconfig,
    out: "api-reference",
    excludePrivate: true,
    excludeInternal: true,
  }

  return typedoc === true ? defaults : { ...defaults, ...typedoc }
}

export function createTypeDocPlugin(typedocConfig: TypeDocConfig, routesDir: string): Plugin {
  return {
    name: "ardo:typedoc",
    async buildStart() {
      if (!typedocConfig.enabled || typedocGenerated) {
        return
      }

      typedocGenerated = true
      console.log("[ardo] Generating API documentation with TypeDoc...")
      const startTime = Date.now()

      try {
        const docs = await generateApiDocs(typedocConfig, routesDir)
        const duration = Date.now() - startTime
        console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
      } catch (error) {
        console.warn("[ardo] TypeDoc generation failed. API documentation will not be available.")
        console.warn("[ardo] Check your typedoc.entryPoints configuration.")
        if (error instanceof Error) {
          console.warn(`[ardo] Error: ${error.message}`)
        }
      }
    },
  }
}
