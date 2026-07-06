import { createHighlighter, type Highlighter } from "shiki"

import type { MarkdownConfig } from "../config/types"

import { resolveHighlightLanguage, warnHighlightFailure } from "./shiki-language"
import { getBundledThemes, highlightWithTheme, resolveThemeConfig } from "./shiki-theme"

export { rehypeShikiFromHighlighter } from "./shiki-rehype"
export { ardoLineTransformer, remarkCodeMeta } from "./shiki-transformer"

export type ShikiHighlighter = Highlighter

const cachedHighlighterPromises = new Map<string, Promise<ShikiHighlighter>>()

/**
 * Highlights code using Shiki with Ardo's default themes.
 * Creates and caches a highlighter instance for reuse.
 */
export async function highlightCode(
  code: string,
  language: string,
  options?: { sourcePath?: string; theme?: MarkdownConfig["theme"] }
): Promise<string> {
  const themeConfig = resolveThemeConfig(options?.theme)
  const highlighter = await getCachedHighlighter(themeConfig)
  const highlightLanguage = await resolveHighlightLanguage({
    highlighter,
    language,
    sourcePath: options?.sourcePath,
  })

  return highlightCodeWithFallback({
    code,
    highlighter,
    language: highlightLanguage,
    sourcePath: options?.sourcePath,
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

export async function createShikiHighlighter(
  config: MarkdownConfig = {}
): Promise<ShikiHighlighter> {
  const themeConfig = resolveThemeConfig(config.theme)

  return createHighlighter({
    themes: getBundledThemes(themeConfig),
    langs: [],
  })
}

function highlightCodeWithFallback(params: {
  code: string
  highlighter: ShikiHighlighter
  language: string
  sourcePath?: string
  themeConfig: MarkdownConfig["theme"]
}): string {
  try {
    return highlightWithTheme(params)
  } catch (error) {
    warnHighlightFailure({
      error,
      key: `render:${params.language}`,
      language: params.language,
      message: "highlighting failed",
      sourcePath: params.sourcePath,
    })

    if (params.language === "text") {
      throw error
    }

    return highlightWithTheme({ ...params, language: "text" })
  }
}

function getThemeCacheKey(themeConfig: MarkdownConfig["theme"]): string {
  if (themeConfig == null) {
    return "default"
  }

  if (typeof themeConfig === "string") {
    return themeConfig
  }

  return `${themeConfig.light}\u0000${themeConfig.dark}`
}
