import type { Plugin } from "vite"

import path from "node:path"

import type { TypeDocConfig } from "../typedoc/types"

import { generateApiDocs } from "../typedoc/generator"
import { findPackageRoot } from "./git-utils"
import { resolveRoutesDir } from "./path-utils"
import { writeRoutesFileSync } from "./routes-core"

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

export function createTypeDocPlugin(
  typedocConfig: TypeDocConfig,
  routesDirOption: string | undefined
): Plugin {
  let routesDir = resolveRoutesDir(process.cwd(), routesDirOption)
  let root = process.cwd()
  let typedocGenerated = false

  async function generateTypeDocOnce(): Promise<void> {
    if (!typedocConfig.enabled || typedocGenerated) {
      return
    }

    typedocGenerated = true
    console.log("[ardo] Generating API documentation with TypeDoc...")
    const startTime = Date.now()

    try {
      const docs = await generateApiDocs(typedocConfig, routesDir)
      writeGeneratedRoutesFile(root, routesDir)
      logTypeDocSuccess(docs.length, startTime)
    } catch (error) {
      handleTypeDocError(error)
    }
  }

  return {
    name: "ardo:typedoc",
    async config(userConfig) {
      root = userConfig.root ?? process.cwd()
      routesDir = resolveRoutesDir(root, routesDirOption)
      await generateTypeDocOnce()
    },
    async buildStart() {
      await generateTypeDocOnce()
    },
  }
}

function writeGeneratedRoutesFile(root: string, routesDir: string): void {
  const appDir = path.resolve(root, "app")
  writeRoutesFileSync({
    appDir,
    routesDir,
    routesFilePath: path.join(appDir, "routes.ts"),
  })
}

function logTypeDocSuccess(pageCount: number, startTime: number): void {
  const duration = Date.now() - startTime
  console.log(`[ardo] Generated ${pageCount} API documentation pages in ${duration}ms`)
}

function handleTypeDocError(error: unknown): void {
  if (isTypeDocSafetyError(error)) {
    throw error
  }

  console.warn("[ardo] TypeDoc generation failed. API documentation will not be available.")
  console.warn("[ardo] Check your typedoc.entryPoints configuration.")
  if (error instanceof Error) {
    console.warn(`[ardo] Error: ${error.message}`)
  }
}

function isTypeDocSafetyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("typedoc.out") || error.message.includes("Refusing to delete"))
  )
}
