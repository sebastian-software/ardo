import type { Plugin } from "vite"

import mdx from "@mdx-js/rollup"
import { reactRouter } from "@react-router/dev/vite"
import rehypeShiki from "@shikijs/rehype"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"

import type { ArdoConfig } from "../config/types"

import { defaultMarkdownConfig } from "../config/index"
import { remarkCallouts } from "../markdown/remark-callouts"
import { remarkMdxHandle } from "../markdown/remark-mdx-handle"
import { remarkMdxToc } from "../markdown/remark-mdx-toc"
import { remarkStripFrontmatterH1 } from "../markdown/remark-strip-frontmatter-h1"
import { ardoLineTransformer, remarkCodeMeta } from "../markdown/shiki"
import { recmaWrapExport } from "./recma-wrap-export"

export function createMdxPlugin(markdownConfig: ArdoConfig["markdown"]): Plugin {
  return mdx(createMdxOptions(markdownConfig)) as Plugin
}

export function createMdxOptions(
  markdownConfig: ArdoConfig["markdown"]
): Parameters<typeof mdx>[0] {
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

  return {
    include: /\.(md|mdx)$/,
    remarkPlugins: [
      remarkFrontmatter,
      remarkStripFrontmatterH1,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
      remarkMdxHandle,
      remarkGfm,
      remarkCallouts,
      remarkCodeMeta,
      [
        remarkMdxToc,
        { anchor: markdownConfig?.anchor, levels: markdownConfig?.toc?.level ?? [2, 3] },
      ],
      ...(markdownConfig?.remarkPlugins ?? []),
    ],
    rehypePlugins: [[rehypeShiki, shikiOptions], ...(markdownConfig?.rehypePlugins ?? [])],
    recmaPlugins: [recmaWrapExport],
    providerImportSource: "ardo/mdx-provider",
  }
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
