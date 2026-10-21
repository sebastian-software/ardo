import type { Plugin } from "vite"

import { reactRouter } from "@react-router/dev/vite"
import { transformWithOxc } from "vite"

import type { ArdoConfig } from "../config/types"
import type { NativeMarkdownFormat } from "../markdown/native-metadata"

import { compileMdxRouteModule } from "./mdx-compile"

type CompileInput = {
  format: NativeMarkdownFormat
  markdownConfig: ArdoConfig["markdown"]
  source: string
  sourceName: string
}

type CompiledRouteModule = Awaited<ReturnType<typeof compileRouteModule>>

type CompiledRouteEntry = { result: Promise<CompiledRouteModule>; source: string }

/**
 * React Router compiles every route several times per build: in the client and
 * SSR builds, as the `?__react-router-build-client-route` variant, and in its
 * Vite child compiler that detects route exports. Each config evaluation
 * creates new plugin instances, so the cache is shared by module and keyed by
 * the Markdown options, the file, and its exact source.
 */
const compiledRoutes = new Map<string, CompiledRouteEntry>()

/** Compile Markdown and MDX route modules with Ferromark and Ferriki. */
export function createMdxPlugin(markdownConfig: ArdoConfig["markdown"]): Plugin {
  const configKey = JSON.stringify(markdownConfig ?? null)
  return {
    enforce: "pre",
    name: "ardo:ferromark",
    async transform(source, id) {
      const format = getMarkdownFormat(id)
      if (format == null) return

      const sourceName = id.split("?", 1)[0] ?? id
      const compiled = await compileRouteModuleCached(configKey, {
        format,
        markdownConfig,
        source,
        sourceName,
      })
      return { code: compiled.code, map: compiled.map }
    },
  }
}

export function getReactRouterPlugins(): Plugin[] {
  const routerPlugin = reactRouter()
  return Array.isArray(routerPlugin) ? routerPlugin : [routerPlugin]
}

async function compileRouteModuleCached(
  configKey: string,
  input: CompileInput
): Promise<CompiledRouteModule> {
  const key = `${configKey}\0${input.format}\0${input.sourceName}`
  const cached = compiledRoutes.get(key)
  if (cached?.source === input.source) return cached.result

  const result = compileRouteModule(input)
  compiledRoutes.set(key, { result, source: input.source })
  try {
    return await result
  } catch (error) {
    if (compiledRoutes.get(key)?.result === result) compiledRoutes.delete(key)
    throw error
  }
}

async function compileRouteModule({ format, markdownConfig, source, sourceName }: CompileInput) {
  const module = compileMdxRouteModule({ format, id: sourceName, markdownConfig, source })
  const transformed = await transformWithOxc(
    module.code,
    sourceName,
    {
      jsx: { runtime: "automatic" },
      lang: "jsx",
      sourcemap: true,
      sourceType: "module",
    },
    module.map
  )
  return { code: transformed.code, map: transformed.map ?? module.map }
}

function getMarkdownFormat(id: string): NativeMarkdownFormat | undefined {
  const [path = id, query = ""] = id.split("?", 2)
  if (query.split("&").some((parameter) => parameter === "raw" || parameter === "url")) {
    return undefined
  }
  if (path.endsWith(".mdx")) return "mdx"
  if (path.endsWith(".md")) return "md"
  return undefined
}
