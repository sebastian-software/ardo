import { createHighlighter, type Highlighter } from "shiki"

import type { MarkdownConfig } from "../config/types"

import { getBundledThemes, highlightWithTheme, resolveThemeConfig } from "./shiki-theme"

export { rehypeShikiFromHighlighter } from "./shiki-rehype"
export { ardoLineTransformer, remarkCodeMeta } from "./shiki-transformer"

export type ShikiHighlighter = Highlighter

let cachedHighlighterPromise: Promise<ShikiHighlighter> | undefined

/**
 * Highlights code using Shiki with Ardo's default themes.
 * Creates and caches a highlighter instance for reuse.
 */
export async function highlightCode(
  code: string,
  language: string,
  options?: { theme?: MarkdownConfig["theme"] }
): Promise<string> {
  const themeConfig = resolveThemeConfig(options?.theme)
  const highlighter = await getCachedHighlighter(themeConfig)

  return highlightWithTheme({
    code,
    highlighter,
    language,
    themeConfig,
  })
}

async function getCachedHighlighter(
  themeConfig: MarkdownConfig["theme"]
): Promise<ShikiHighlighter> {
  cachedHighlighterPromise ??= createShikiHighlighter({
    anchor: false,
    lineNumbers: false,
    theme: themeConfig,
    toc: { level: [2, 3] },
  })

  return cachedHighlighterPromise
}

export async function createShikiHighlighter(config: MarkdownConfig): Promise<ShikiHighlighter> {
  const themeConfig = resolveThemeConfig(config.theme)

  return createHighlighter({
    themes: getBundledThemes(themeConfig),
    langs: [
      // Web fundamentals
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "html",
      "css",
      "scss",

      // Data & config formats
      "json",
      "jsonc",
      "yaml",
      "toml",
      "xml",
      "graphql",

      // Markdown & docs
      "markdown",
      "mdx",

      // Shell & DevOps
      "bash",
      "shell",
      "dockerfile",

      // General purpose
      "python",
      "rust",
      "go",
      "sql",
      "diff",
    ],
  })
}
