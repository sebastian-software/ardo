import type { Plugin } from "vite"

import mdx from "@mdx-js/rollup"
import { reactRouter } from "@react-router/dev/vite"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"

import type { ArdoConfig, MarkdownConfig } from "../config/types"

import { defaultMarkdownConfig } from "../config/index"
import { remarkCallouts } from "../markdown/remark-callouts"
import { remarkMdxHandle } from "../markdown/remark-mdx-handle"
import { remarkMdxToc } from "../markdown/remark-mdx-toc"
import { remarkMermaid } from "../markdown/remark-mermaid"
import { remarkStripFrontmatterH1 } from "../markdown/remark-strip-frontmatter-h1"
import {
  createShikiHighlighter,
  rehypeShikiFromHighlighter,
  remarkCodeMeta,
} from "../markdown/shiki"
import { recmaWrapExport } from "./recma-wrap-export"

export function createMdxPlugin(markdownConfig: ArdoConfig["markdown"]): Plugin {
  return mdx(createMdxOptions(markdownConfig)) as Plugin
}

export function createMdxOptions(
  markdownConfig: ArdoConfig["markdown"]
): Parameters<typeof mdx>[0] {
  const themeConfig = markdownConfig?.theme ?? defaultMarkdownConfig.theme
  const lineNumbers = markdownConfig?.lineNumbers ?? false

  return {
    include: /\.(md|mdx)$/,
    remarkPlugins: [
      remarkFrontmatter,
      remarkStripFrontmatterH1,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
      remarkMdxHandle,
      remarkGfm,
      remarkCallouts,
      remarkMermaid,
      remarkCodeMeta,
      [
        remarkMdxToc,
        { anchor: markdownConfig?.anchor, levels: markdownConfig?.toc?.level ?? [2, 3] },
      ],
      ...(markdownConfig?.remarkPlugins ?? []),
    ],
    rehypePlugins: [
      [rehypeFerriki, { lineNumbers, theme: themeConfig }],
      ...(markdownConfig?.rehypePlugins ?? []),
    ],
    recmaPlugins: [recmaWrapExport],
    providerImportSource: "ardo/mdx-provider",
  }
}

function rehypeFerriki(options: Pick<MarkdownConfig, "lineNumbers" | "theme">) {
  let highlighterPromise: ReturnType<typeof createShikiHighlighter> | undefined

  return async function transformWithFerriki(
    tree: Parameters<ReturnType<typeof rehypeShikiFromHighlighter>>[0]
  ) {
    highlighterPromise ??= createShikiHighlighter(options)
    const highlighter = await highlighterPromise
    await rehypeShikiFromHighlighter({ config: options, highlighter })(tree)
  }
}

export function getReactRouterPlugins(): Plugin[] {
  const routerPlugin = reactRouter()
  return Array.isArray(routerPlugin) ? routerPlugin : [routerPlugin]
}
