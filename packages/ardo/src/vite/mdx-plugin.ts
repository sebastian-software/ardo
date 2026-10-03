import type { Plugin } from "vite"

import { reactRouter } from "@react-router/dev/vite"
import { transformWithOxc } from "vite"

import type { ArdoConfig } from "../config/types"
import type { NativeMarkdownFormat } from "../markdown/native-metadata"

import { compileMdxRouteModule } from "./mdx-compile"

/** Compile Markdown and MDX route modules with Ferromark and Ferriki. */
export function createMdxPlugin(markdownConfig: ArdoConfig["markdown"]): Plugin {
  return {
    enforce: "pre",
    name: "ardo:ferromark",
    async transform(source, id) {
      const format = getMarkdownFormat(id)
      if (format == null) return

      const sourceName = id.split("?", 1)[0] ?? id
      const module = compileMdxRouteModule({
        format,
        id: sourceName,
        markdownConfig,
        source,
      })
      const transformed = await transformWithOxc(
        module.code,
        sourceName,
        {
          jsx: { runtime: "automatic" },
          lang: format === "mdx" ? "tsx" : "jsx",
          sourcemap: true,
          sourceType: "module",
        },
        module.map
      )
      return { code: transformed.code, map: transformed.map ?? module.map }
    },
  }
}

export function getReactRouterPlugins(): Plugin[] {
  const routerPlugin = reactRouter()
  return Array.isArray(routerPlugin) ? routerPlugin : [routerPlugin]
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
