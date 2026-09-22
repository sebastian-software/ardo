import type { BundledTheme, Highlighter } from "ferriki"
import type { Root } from "hast"

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
  if (themeConfig == null) return [DEFAULT_THEMES.light, DEFAULT_THEMES.dark]
  return typeof themeConfig === "string" ? [themeConfig] : [themeConfig.light, themeConfig.dark]
}

export function highlightWithTheme(params: {
  code: string
  highlighter: Highlighter
  language: string
  themeConfig: MarkdownConfig["theme"]
}): string {
  const { code, highlighter, language, themeConfig } = params

  const resolved = themeConfig ?? DEFAULT_THEMES

  if (typeof resolved === "string") {
    return highlighter.codeToHtml(code, { lang: language, theme: resolved })
  }

  return highlighter.codeToHtml(code, {
    defaultColor: false,
    lang: language,
    themes: { dark: resolved.dark, light: resolved.light },
  })
}

export function highlightWithThemeHast(params: {
  code: string
  highlighter: Highlighter
  language: string
  themeConfig: MarkdownConfig["theme"]
}): Root {
  const { code, highlighter, language, themeConfig } = params
  const resolved = themeConfig ?? DEFAULT_THEMES

  if (typeof resolved === "string") {
    return toHastRoot(highlighter.codeToHast(code, { lang: language, theme: resolved }))
  }

  return toHastRoot(
    highlighter.codeToHast(code, {
      defaultColor: false,
      lang: language,
      themes: { dark: resolved.dark, light: resolved.light },
    })
  )
}

function toHastRoot(value: unknown): Root {
  if (!isHastRoot(value)) {
    throw new Error("Ferriki returned an invalid HAST root")
  }

  return value
}

function isHastRoot(value: unknown): value is Root {
  return isRecord(value) && value.type === "root" && Array.isArray(value.children)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}
