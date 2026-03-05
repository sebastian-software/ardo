import type { Plugin } from "vite"

import fsSync, { type FSWatcher } from "node:fs"
import path from "node:path"

import type { TypeDocConfig } from "./types"

import { generateApiDocs } from "./generator"

export interface TypeDocPluginOptions extends Partial<TypeDocConfig> {
  /**
   * Content directory where markdown files are stored
   * @default './content'
   */
  contentDir?: string

  /**
   * Run TypeDoc on every build
   * @default false in dev, true in build
   */
  runOnBuild?: boolean

  /**
   * Run TypeDoc on startup
   * @default true
   */
  runOnStart?: boolean
}

/**
 * Vite plugin for generating API documentation with TypeDoc.
 */
export function typedocPlugin(options: TypeDocPluginOptions = {}): Plugin {
  const { contentDir = "./content", runOnBuild, runOnStart = true } = options
  const typedocConfig = createTypedocConfig(options)

  let isBuilding = false
  let hasGenerated = false
  const generate = createGenerator({
    contentDir,
    onGenerated: () => {
      hasGenerated = true
    },
    typedocConfig,
  })

  return {
    name: "ardo:typedoc",

    async buildStart() {
      if (runOnStart && !hasGenerated) {
        await generate()
      }
    },

    async buildEnd() {
      if (isBuilding && runOnBuild !== false) {
        await generate()
      }
    },

    configResolved(resolvedConfig) {
      isBuilding = resolvedConfig.command === "build"
    },

    async handleHotUpdate({ file }) {
      if (shouldRegenerateForFile(file, typedocConfig)) {
        await generate()
        return []
      }
    },
  }
}

function createTypedocConfig(options: TypeDocPluginOptions): TypeDocConfig {
  const {
    enabled = true,
    entryPoints = ["./src/index.ts"],
    out = "api-reference",
    excludePrivate = true,
    excludeInternal = true,
    ...restConfig
  } = options

  return {
    ...restConfig,
    enabled,
    entryPoints,
    excludeInternal,
    excludePrivate,
    out,
  }
}

function shouldRegenerateForFile(file: string, config: TypeDocConfig): boolean {
  if (!config.watch) {
    return false
  }

  return config.entryPoints.some((entryPoint) => file.includes(entryPoint))
}

function createGenerator(params: {
  contentDir: string
  onGenerated: () => void
  typedocConfig: TypeDocConfig
}): () => Promise<void> {
  const { contentDir, onGenerated, typedocConfig } = params

  return async () => {
    if (!typedocConfig.enabled) {
      return
    }

    console.log("[ardo] Generating API documentation with TypeDoc...")
    const startTime = Date.now()

    try {
      const docs = await generateApiDocs(typedocConfig, contentDir)
      const duration = Date.now() - startTime
      console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
      onGenerated()
    } catch (error) {
      console.error("[ardo] TypeDoc generation failed:", error)
      throw error
    }
  }
}

export function createTypedocWatcher(
  config: TypeDocConfig,
  contentDir: string,
  onChange?: () => void
): { start: () => void; stop: () => void } {
  let watcher: FSWatcher | null = null

  async function regenerateForChangedFile(filename: string): Promise<void> {
    if (!isSupportedTypedocFile(filename)) {
      return
    }

    console.log(`[ardo] Source file changed: ${filename}`)
    await generateApiDocs(config, contentDir)
    onChange?.()
  }

  return {
    start() {
      if (!config.watch || config.entryPoints.length === 0) {
        return
      }

      const entryDir = path.dirname(config.entryPoints[0])
      try {
        watcher = fsSync.watch(entryDir, { recursive: true }, (_event, filename) => {
          if (filename != null) {
            void regenerateForChangedFile(filename)
          }
        })
      } catch {
        console.warn("[ardo] Could not start TypeDoc watcher")
      }
    },

    stop() {
      if (watcher != null) {
        watcher.close()
        watcher = null
      }
    },
  }
}

function isSupportedTypedocFile(filename: string): boolean {
  return filename.endsWith(".ts") || filename.endsWith(".tsx")
}
