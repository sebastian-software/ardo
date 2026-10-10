import {
  createHighlighter,
  type Highlighter,
  type ShikiTransformer,
  type ThemeInput,
} from "@ferriki/core"

import { parseHighlightLines, parseLabel, parseTitle } from "./code-meta"

export type FerrikiHighlightOptions = {
  sourcePath?: string
  theme?: FerrikiTheme
  lineNumbers?: boolean
  meta?: string
}

type FerrikiTheme = { dark: ThemeInput; light: ThemeInput } | ThemeInput

const defaultTheme = { light: "github-light-default", dark: "github-dark-default" }
const highlighterPromises = new Map<string, Promise<Highlighter>>()
const failedLanguageWarnings = new Set<string>()

/**
 * Compatibility HTML renderer exported from ardo/vite. Native Markdown and
 * literal TSX fences use JsxCompiler instead. The highlighter is cached by theme and
 * loads language assets only when a document first uses that language.
 */
export async function highlightCode(
  code: string,
  language: string,
  options: FerrikiHighlightOptions = {}
): Promise<string> {
  const highlighter = await getHighlighter(options.theme)
  const resolvedLanguage = await loadLanguage(highlighter, language, options.sourcePath)
  return renderHtml({
    code,
    highlighter,
    language: resolvedLanguage,
    meta: options.meta ?? "",
    options,
  })
}

function renderHtml(input: {
  code: string
  highlighter: Highlighter
  language: string
  meta: string
  options: FerrikiHighlightOptions
}): string {
  const { code, highlighter, language, meta, options } = input
  const highlightOptions = {
    ...themeOptions(options.theme),
    lang: language,
    meta: { __raw: meta },
    transformers: [ardoLineTransformer({ globalLineNumbers: options.lineNumbers ?? false })],
  }

  try {
    return highlighter.codeToHtml(code, highlightOptions)
  } catch (error) {
    warnHighlightFailure(error, language, options.sourcePath)
    if (language === "text") {
      throw error
    }

    return highlighter.codeToHtml(code, { ...highlightOptions, lang: "text" })
  }
}

async function loadLanguage(
  highlighter: Highlighter,
  language: string,
  sourcePath?: string
): Promise<string> {
  if (language === "" || language === "text" || language === "plain" || language === "plaintext") {
    return "text"
  }

  try {
    await highlighter.loadLanguage(language)
    return highlighter.resolveLangAlias(language)
  } catch (error) {
    warnHighlightFailure(error, language, sourcePath)
    return "text"
  }
}

async function getHighlighter(theme: FerrikiTheme | undefined): Promise<Highlighter> {
  const cacheKey = themeKey(theme)
  let highlighterPromise = highlighterPromises.get(cacheKey)
  if (highlighterPromise == null) {
    highlighterPromise = createHighlighter({ themes: themeNames(theme) }).catch(
      (error: unknown) => {
        // Asset downloads can fail transiently; let later transforms retry.
        highlighterPromises.delete(cacheKey)
        throw error
      }
    )
    highlighterPromises.set(cacheKey, highlighterPromise)
  }

  return highlighterPromise
}

function themeNames(theme: FerrikiTheme | undefined): ThemeInput[] {
  const normalized = theme ?? defaultTheme
  if (typeof normalized === "string") return [normalized]
  if (isThemePair(normalized)) return [...new Set([normalized.light, normalized.dark])]
  return [normalized]
}

function themeOptions(
  theme: FerrikiTheme | undefined
):
  { defaultColor: false; themes: { dark: ThemeInput; light: ThemeInput } } | { theme: ThemeInput } {
  const normalized = theme ?? defaultTheme
  if (!isThemePair(normalized)) {
    return { theme: normalized }
  }

  return {
    defaultColor: false,
    themes: { light: normalized.light, dark: normalized.dark },
  }
}

function themeKey(theme: FerrikiTheme | undefined): string {
  const normalized = theme ?? defaultTheme
  if (typeof normalized === "string") return normalized
  return JSON.stringify(normalized)
}

function isThemePair(value: FerrikiTheme): value is { light: ThemeInput; dark: ThemeInput } {
  return isRecord(value) && "light" in value && "dark" in value
}

function warnHighlightFailure(error: unknown, language: string, sourcePath?: string): void {
  const key = `${sourcePath ?? ""}\u0000${language}`
  if (failedLanguageWarnings.has(key)) return
  failedLanguageWarnings.add(key)

  const source = sourcePath == null ? "" : ` in ${sourcePath}`
  console.warn(
    `[ardo] Could not highlight ${JSON.stringify(language)}${source}; using plain text.`,
    error
  )
}

type ArdoLineTransformerOptions = {
  globalLineNumbers?: boolean
}

type LineTransformerState = {
  highlightLines: number[]
  metaRaw: string
  showLineNumbers: boolean
}

type TransformerNode = {
  properties?: Record<string, unknown>
}

function ardoLineTransformer(options: ArdoLineTransformerOptions = {}): ShikiTransformer {
  const state: LineTransformerState = {
    highlightLines: [],
    metaRaw: "",
    showLineNumbers: false,
  }

  return {
    name: "ardo:lines",
    preprocess(_code, highlightOptions) {
      const metaRaw = getMetaRaw(highlightOptions.meta)
      state.metaRaw = metaRaw
      state.highlightLines = parseHighlightLines(metaRaw)
      state.showLineNumbers =
        (options.globalLineNumbers ?? false) || metaRaw.includes("showLineNumbers")
    },
    pre(node) {
      const properties = ensureNodeProperties(node)
      applyTitleProperty(properties, state.metaRaw)
      applyLabelProperty(properties, state.metaRaw)
    },
    line(node, line) {
      const properties = ensureNodeProperties(node)
      applyHighlightedLineClass(properties, state.highlightLines, line)

      if (state.showLineNumbers) {
        properties["data-ln"] = String(line)
      }
    },
  }
}

function getMetaRaw(meta: unknown): string {
  if (!isRecord(meta)) return ""
  const raw = meta.__raw
  return typeof raw === "string" ? raw : ""
}

function ensureNodeProperties(node: TransformerNode): Record<string, unknown> {
  node.properties ??= {}
  return node.properties
}

function applyTitleProperty(properties: Record<string, unknown>, metaRaw: string): void {
  const title = parseTitle(metaRaw)
  if (title != null && title.length > 0) properties["data-title"] = title
}

function applyLabelProperty(properties: Record<string, unknown>, metaRaw: string): void {
  const label = parseLabel(metaRaw)
  if (label != null && label.length > 0) properties["data-label"] = label
}

function applyHighlightedLineClass(
  properties: Record<string, unknown>,
  highlightLines: number[],
  line: number
): void {
  if (!highlightLines.includes(line)) return
  const currentClass = typeof properties.class === "string" ? properties.class : ""
  properties.class = currentClass.length > 0 ? `${currentClass} highlighted` : "highlighted"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}
