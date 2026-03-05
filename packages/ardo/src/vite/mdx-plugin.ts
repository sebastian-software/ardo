import type { Plugin } from "vite"

import mdx from "@mdx-js/rollup"
import { reactRouter } from "@react-router/dev/vite"
import rehypeShiki from "@shikijs/rehype"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"

import type { ArdoConfig } from "../config/types"

import { defaultMarkdownConfig } from "../config/index"
import { ardoLineTransformer, remarkCodeMeta } from "../markdown/shiki"

export function createMdxPlugin(markdownConfig: ArdoConfig["markdown"]): Plugin {
  const themeConfig = markdownConfig?.theme ?? defaultMarkdownConfig.theme
  const lineNumbers = markdownConfig?.lineNumbers ?? false
  const shikiOptions = isShikiThemeObject(themeConfig)
    ? {
        themes: { light: themeConfig.light, dark: themeConfig.dark },
        defaultColor: false as const,
        transformers: [ardoLineTransformer({ globalLineNumbers: lineNumbers })],
      }
    : {
        theme: themeConfig,
        transformers: [ardoLineTransformer({ globalLineNumbers: lineNumbers })],
      }

  return mdx({
    include: /\.(md|mdx)$/,
    remarkPlugins: [
      remarkFrontmatter,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
      remarkGfm,
      remarkCodeMeta,
    ],
    rehypePlugins: [[rehypeShiki, shikiOptions]],
    providerImportSource: "ardo/mdx-provider",
  }) as Plugin
}

export function getReactRouterPlugins(): Plugin[] {
  const routerPlugin = reactRouter()
  return Array.isArray(routerPlugin) ? routerPlugin : [routerPlugin]
}

function isShikiThemeObject(themeConfig: unknown): themeConfig is { dark: string; light: string } {
  return (
    typeof themeConfig === "object" &&
    themeConfig != null &&
    "light" in themeConfig &&
    "dark" in themeConfig
  )
}
