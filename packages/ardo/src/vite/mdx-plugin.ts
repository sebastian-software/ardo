import type { Plugin } from "vite"

import { transformWithOxc } from "vite"

import type { ArdoConfig } from "../config/types"
import type { NativeMarkdownFormat } from "../markdown/native-metadata"

import { compileMdxRouteModuleWithCode } from "./mdx-compile"
import type { PublicationPostBinding } from "./publication-routes"

type CompileInput = {
  format: NativeMarkdownFormat
  markdownConfig: ArdoConfig["markdown"]
  /** The page's Markdown file URL, when the build writes one for this route. */
  pageMarkdownPath: string | undefined
  /** The modules a generated publication post mounts, for exactly those routes. */
  publicationPost: PublicationPostBinding | undefined
  source: string
  sourceName: string
}

/** What the plugin knows about one route file. */
export type RouteContext = {
  pageMarkdownPath?: string
  publicationPost?: PublicationPostBinding
}

type CompiledRouteModule = Awaited<ReturnType<typeof compileRouteModule>>

type CompiledRouteEntry = { result: Promise<CompiledRouteModule>; source: string }

/**
 * The client and server builds compile every route, and each config evaluation
 * creates new plugin instances, so the cache is shared by module and keyed by
 * the Markdown options, the file, and its exact source.
 */
const compiledRoutes = new Map<string, CompiledRouteEntry>()

/**
 * Compile Markdown and MDX route modules with Ferromark and Ferriki. `route` tells, for a route
 * file, the URL of the page's Markdown file, if the build writes one, and the binding of a
 * generated publication post.
 */
export function createMdxPlugin(
  markdownConfig: ArdoConfig["markdown"],
  route?: (filePath: string) => RouteContext
): Plugin {
  const configKey = JSON.stringify(markdownConfig ?? null)
  return {
    enforce: "pre",
    name: "ardo:ferromark",
    async transform(source, id) {
      const format = getMarkdownFormat(id)
      if (format == null) return

      const sourceName = id.split("?", 1)[0] ?? id
      const context = route?.(sourceName)
      const compiled = await compileRouteModuleCached(configKey, {
        format,
        markdownConfig,
        pageMarkdownPath: context?.pageMarkdownPath,
        publicationPost: context?.publicationPost,
        source,
        sourceName,
      })
      return { code: compiled.code, map: compiled.map }
    },
  }
}

async function compileRouteModuleCached(
  configKey: string,
  input: CompileInput
): Promise<CompiledRouteModule> {
  // The Markdown file URL depends on site settings, not only on the source, so it is part of the key.
  const key = [
    configKey,
    input.format,
    input.sourceName,
    input.pageMarkdownPath ?? "",
    JSON.stringify(input.publicationPost ?? null),
  ].join("\0")
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

async function compileRouteModule({
  format,
  markdownConfig,
  pageMarkdownPath,
  publicationPost,
  source,
  sourceName,
}: CompileInput) {
  const module = await compileMdxRouteModuleWithCode({
    format,
    id: sourceName,
    markdownConfig,
    pageMarkdownPath,
    publicationPost,
    source,
  })
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
