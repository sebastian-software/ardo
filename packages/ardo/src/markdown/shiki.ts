import { type BundledLanguage, bundledLanguages, createHighlighter, type Highlighter } from "shiki"

import type { MarkdownConfig } from "../config/types"

import { getBundledThemes, highlightWithTheme, resolveThemeConfig } from "./shiki-theme"

export { rehypeShikiFromHighlighter } from "./shiki-rehype"
export { ardoLineTransformer, remarkCodeMeta } from "./shiki-transformer"

export type ShikiHighlighter = Highlighter

const allBundledLanguages = Object.keys(bundledLanguages).filter(isBundledLanguage)
const cachedHighlighterPromises = new Map<string, Promise<ShikiHighlighter>>()

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
  const cacheKey = getThemeCacheKey(themeConfig)
  let highlighterPromise = cachedHighlighterPromises.get(cacheKey)
  if (highlighterPromise == null) {
    highlighterPromise = createShikiHighlighter({
      anchor: false,
      lineNumbers: false,
      theme: themeConfig,
      toc: { level: [2, 3] },
    })
    cachedHighlighterPromises.set(cacheKey, highlighterPromise)
  }

  return highlighterPromise
}

export async function createShikiHighlighter(config: MarkdownConfig): Promise<ShikiHighlighter> {
  const themeConfig = resolveThemeConfig(config.theme)

  return createHighlighter({
    themes: getBundledThemes(themeConfig),
    langs: allBundledLanguages,
  })
}

function getThemeCacheKey(themeConfig: MarkdownConfig["theme"]): string {
  if (themeConfig == null) {
    return "default"
  }

  return typeof themeConfig === "string"
    ? `theme:${themeConfig}`
    : `themes:${themeConfig.light}\0${themeConfig.dark}`
}

function isBundledLanguage(language: string): language is BundledLanguage {
  return language in bundledLanguages
}
