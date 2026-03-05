import type { BundledTheme, Highlighter } from "shiki"

import type { MarkdownConfig } from "../config/types"

/** Default Ardo themes used when no config is provided */
export const DEFAULT_THEMES = {
  light: "github-light-default" as BundledTheme,
  dark: "github-dark-default" as BundledTheme,
}

export function resolveThemeConfig(
  theme: MarkdownConfig["theme"] | undefined
): MarkdownConfig["theme"] {
  return theme ?? DEFAULT_THEMES
}

export function getBundledThemes(themeConfig: MarkdownConfig["theme"]): BundledTheme[] {
  return typeof themeConfig === "string" ? [themeConfig] : [themeConfig.light, themeConfig.dark]
}

export function highlightWithTheme(params: {
  code: string
  highlighter: Highlighter
  language: string
  themeConfig: MarkdownConfig["theme"]
}): string {
  const { code, highlighter, language, themeConfig } = params

  if (typeof themeConfig === "string") {
    return highlighter.codeToHtml(code, { lang: language, theme: themeConfig })
  }

  return highlighter.codeToHtml(code, {
    defaultColor: false,
    lang: language,
    themes: { dark: themeConfig.dark, light: themeConfig.light },
  })
}
