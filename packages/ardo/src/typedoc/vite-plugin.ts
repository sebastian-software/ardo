import type { Plugin } from 'vite'
import type { TypeDocConfig } from './types'
import { generateApiDocs } from './generator'
import path from 'path'
import fsSync from 'fs'
import type { FSWatcher } from 'fs'

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
 *
 * @example
 * ```ts
 * // Minimal config (uses ./src/index.ts as entry point)
 * typedocPlugin()
 *
 * // Custom entry point
 * typedocPlugin({ entryPoints: ['./lib/index.ts'] })
 *
 * // Full config
 * typedocPlugin({
 *   entryPoints: ['./src/index.ts'],
 *   out: 'api-reference',
 *   excludePrivate: true,
 * })
 * ```
 */
export function typedocPlugin(options: TypeDocPluginOptions = {}): Plugin {
  const {
    contentDir = './content',
    runOnBuild,
    runOnStart = true,
    // TypeDoc config with defaults
    enabled = true,
    entryPoints = ['./src/index.ts'],
    out = 'api-reference',
    excludePrivate = true,
    excludeInternal = true,
    ...restConfig
  } = options

  const config: TypeDocConfig = {
    enabled,
    entryPoints,
    out,
    excludePrivate,
    excludeInternal,
    ...restConfig,
  }

  let isBuilding = false
  let hasGenerated = false

  async function generate() {
    if (!config.enabled) return

    console.log('[ardo] Generating API documentation with TypeDoc...')
    const startTime = Date.now()

    try {
      const docs = await generateApiDocs(config, contentDir)
      const duration = Date.now() - startTime
      console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
      hasGenerated = true
    } catch (error) {
      console.error('[ardo] TypeDoc generation failed:', error)
      throw error
    }
  }

  return {
    name: 'ardo:typedoc',

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

    configResolved(config) {
      isBuilding = config.command === 'build'
    },

    async handleHotUpdate({ file }) {
      // Regenerate on source file changes in watch mode
      if (config.watch && config.entryPoints.some((ep) => file.includes(ep))) {
        await generate()
        return []
      }
    },
  }
}

export function createTypedocWatcher(
  config: TypeDocConfig,
  contentDir: string,
  onChange?: () => void
): { start: () => Promise<void>; stop: () => void } {
  let watcher: FSWatcher | null = null

  return {
    async start() {
      if (!config.watch || !config.entryPoints.length) return

      const entryDir = path.dirname(config.entryPoints[0])

      try {
        watcher = fsSync.watch(entryDir, { recursive: true }, async (event, filename) => {
          if (filename?.endsWith('.ts') || filename?.endsWith('.tsx')) {
            console.log(`[ardo] Source file changed: ${filename}`)
            await generateApiDocs(config, contentDir)
            onChange?.()
          }
        })
      } catch {
        console.warn('[ardo] Could not start TypeDoc watcher')
      }
    },

    stop() {
      if (watcher) {
        watcher.close()
        watcher = null
      }
    },
  }
}
