import type { ThemeInput } from "@ferriki/core"

import {
  type CodeHooks,
  composeCodeHooks,
  createDiagramCodeRenderer,
  createLineHighlighter,
  type DiagramRenderer,
} from "ferromark"

import type { MarkdownConfig } from "../config/types"

import {
  defaultTheme,
  type FerrikiTheme,
  getHighlighter,
  isThemePair,
  loadLanguage,
  warnHighlightFailure,
} from "./ferriki"

const diagramRenderers = new Map<string, Promise<DiagramRenderer>>()
const plainLanguages = new Set(["", "text", "plain", "plaintext", "txt"])

/**
 * Code hooks for one document: Ferriki highlights fences through Ferromark's
 * highlighting stage, so Ferromark keeps titles, line annotations and the
 * CodeBlock component. With `markdown.mermaid`, Ferrigura replaces `mermaid`
 * fences with static SVG. Languages load before the synchronous render.
 */
export async function getArdoCodeHooks(
  markdownConfig: MarkdownConfig = {},
  input: { languages: Iterable<string | undefined>; source: string; sourcePath?: string }
): Promise<CodeHooks> {
  const theme = markdownConfig.theme ?? defaultTheme
  const highlighter = await getHighlighter(theme)
  const mermaid = markdownConfig.mermaid ?? false
  const languages = new Set(
    [...input.languages].filter(
      (language): language is string =>
        language != null &&
        !plainLanguages.has(language) &&
        !(mermaid !== false && language === "mermaid")
    )
  )
  await Promise.all(
    [...languages].map((language) => loadLanguage(highlighter, language, input.sourcePath))
  )
  const loaded = new Set(highlighter.getLoadedLanguages())
  const highlight = createLineHighlighter(highlighter, {
    ...themeOption(theme),
    onHighlightError(error, { lang }) {
      warnHighlightFailure(error, lang, input.sourcePath)
    },
  })
  const hooks: CodeHooks = {
    // Unloaded languages were reported while loading; keep them as plain code.
    highlightCodeBlock(...block) {
      const language = block[1]
      return language != null && loaded.has(highlighter.resolveLangAlias(language))
        ? highlight(...block)
        : null
    },
  }
  if (mermaid === false) return hooks
  const diagrams = createDiagramCodeRenderer(
    followArdoColorMode(await getDiagramRenderer(mermaid)),
    {
      colorScheme: "auto",
      onRenderError(error, { start }) {
        const at = start == null ? "" : `:${lineAt(input.source, start)}`
        console.warn(
          `[ardo] Could not render Mermaid diagram${input.sourcePath == null ? "" : ` in ${input.sourcePath}${at}`}; keeping it as code.`,
          error
        )
      },
    }
  )
  return composeCodeHooks(diagrams, hooks)
}

function themeOption(theme: FerrikiTheme) {
  return isThemePair(theme)
    ? { themes: { light: themeName(theme.light), dark: themeName(theme.dark) } }
    : { theme: themeName(theme) }
}

function themeName(theme: ThemeInput): string {
  if (typeof theme === "string") return theme
  const name = (theme as { name?: unknown }).name
  if (typeof name !== "string") throw new TypeError("[ardo] Custom Ferriki themes need a name.")
  return name
}

async function getDiagramRenderer(
  mermaid: Exclude<MarkdownConfig["mermaid"], false | undefined>
): Promise<DiagramRenderer> {
  const config = mermaid === true ? {} : (mermaid.config ?? {})
  const key = JSON.stringify(config)
  let renderer = diagramRenderers.get(key)
  if (renderer == null) {
    renderer = import("@ferrigura/core").then(
      ({ Renderer }) => new Renderer(config),
      (error: unknown) => {
        diagramRenderers.delete(key)
        throw new Error(
          "[ardo] markdown.mermaid needs the optional @ferrigura/core package. Install it next to ardo.",
          { cause: error }
        )
      }
    )
    diagramRenderers.set(key, renderer)
  }
  return renderer
}

const darkMediaRule = "@media (prefers-color-scheme: dark){"

/**
 * Ferrigura switches diagram colors with `prefers-color-scheme`, while Ardo's
 * theme toggle sets `dark` or `light` on the root element. Scope the dark
 * rules to `.dark`, and keep the media query for pages without the class.
 */
function followArdoColorMode(renderer: DiagramRenderer): DiagramRenderer {
  return {
    render: (text, options) => scopeDarkRules(renderer.render(text, options)),
  }
}

export function scopeDarkRules(svg: string): string {
  const start = svg.indexOf(darkMediaRule)
  if (start === -1) return svg
  const bodyStart = start + darkMediaRule.length
  const end = closingBrace(svg, bodyStart)
  if (end === -1) return svg
  const body = svg.slice(bodyStart, end)
  const classRules = prefixSelectors(body, ":root.dark")
  const mediaRules = prefixSelectors(body, ":root:not(.light)")
  const rest = scopeDarkRules(svg.slice(end + 1))
  return `${svg.slice(0, start)}${classRules}${darkMediaRule}${mediaRules}}${rest}`
}

/** Index of the brace that closes the block opened just before `from`, or -1. */
function closingBrace(text: string, from: number): number {
  let depth = 1
  for (let index = from; index < text.length; index++) {
    if (text[index] === "{") depth++
    else if (text[index] === "}" && --depth === 0) return index
  }
  return -1
}

/** Prefix every selector of a flat rule list, such as `#id{…}#id .edge{…}`. */
function prefixSelectors(rules: string, prefix: string): string {
  return rules.replaceAll(/(^|\})([^{}]+)\{/gu, (_match, close: string, selectors: string) => {
    const prefixed = selectors
      .split(",")
      .map((selector) => `${prefix} ${selector.trim()}`)
      .join(",")
    return `${close}${prefixed}{`
  })
}

/** One-based line of a UTF-8 byte offset. */
function lineAt(source: string, byteOffset: number): number {
  const before = Buffer.from(source, "utf8").subarray(0, byteOffset).toString("utf8")
  return before.split("\n").length
}
