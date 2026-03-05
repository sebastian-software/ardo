import type { Element, Root, Text } from "hast"

import {
  type BundledTheme,
  createHighlighter,
  type Highlighter,
  type ShikiTransformer,
} from "shiki"
import { visit } from "unist-util-visit"

import type { MarkdownConfig } from "../config/types"

import { shikiContainer } from "../ui/components/CodeBlock.css"

export type ShikiHighlighter = Highlighter

/** Default Ardo themes used when no config is provided */
const DEFAULT_THEMES = {
  light: "github-light-default" as BundledTheme,
  dark: "github-dark-default" as BundledTheme,
}

let cachedHighlighter: ShikiHighlighter | undefined

/**
 * Highlights code using Shiki with Ardo's default themes.
 * Creates and caches a highlighter instance for reuse.
 */
export async function highlightCode(
  code: string,
  language: string,
  options?: { theme?: MarkdownConfig["theme"] }
): Promise<string> {
  const themeConfig = options?.theme ?? DEFAULT_THEMES

  if (!cachedHighlighter) {
    cachedHighlighter = await createShikiHighlighter({
      theme: themeConfig,
      lineNumbers: false,
      anchor: false,
      toc: { level: [2, 3] },
    })
  }

  if (typeof themeConfig === "string") {
    return cachedHighlighter.codeToHtml(code, { lang: language, theme: themeConfig })
  }

  return cachedHighlighter.codeToHtml(code, {
    lang: language,
    themes: { light: themeConfig.light, dark: themeConfig.dark },
    defaultColor: false,
  })
}

export async function createShikiHighlighter(config: MarkdownConfig): Promise<ShikiHighlighter> {
  const themeConfig = config.theme!

  const themes: BundledTheme[] =
    typeof themeConfig === "string" ? [themeConfig] : [themeConfig.light, themeConfig.dark]

  return createHighlighter({
    themes,
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

interface RehypeShikiOptions {
  highlighter: ShikiHighlighter
  config: MarkdownConfig
}

export function rehypeShikiFromHighlighter(options: RehypeShikiOptions) {
  const { highlighter, config } = options

  const themeConfig = config.theme!

  return function (tree: Root) {
    visit(tree, "element", (node: Element, index, parent) => {
      if (
        node.tagName !== "pre" ||
        !node.children[0] ||
        (node.children[0] as Element).tagName !== "code"
      ) {
        return
      }

      const codeNode = node.children[0] as Element
      const className = (codeNode.properties?.className as string[]) || []
      const langClass = className.find((c) => c.startsWith("language-"))
      const lang = langClass ? langClass.replace("language-", "") : "text"

      const codeContent = getTextContent(codeNode)

      if (!codeContent.trim()) {
        return
      }

      try {
        let html: string

        if (typeof themeConfig === "string") {
          html = highlighter.codeToHtml(codeContent, {
            lang,
            theme: themeConfig,
          })
        } else {
          html = highlighter.codeToHtml(codeContent, {
            lang,
            themes: {
              light: themeConfig.light,
              dark: themeConfig.dark,
            },
            defaultColor: false,
          })
        }

        const metaString = (codeNode.properties?.metastring as string) || ""
        const lineNumbers = config.lineNumbers || metaString.includes("showLineNumbers")
        const highlightLines = parseHighlightLines(metaString)
        const title = parseTitle(metaString)

        const innerHtml = buildCodeBlockHtml(html, {
          lang,
          lineNumbers,
          highlightLines,
          title,
        })

        if (parent && typeof index === "number") {
          const newNode: Element = {
            type: "element",
            tagName: "div",
            properties: {
              className: [shikiContainer],
            },
            children: [
              {
                type: "raw",
                value: innerHtml,
              } as unknown as Element,
            ],
          }
          parent.children[index] = newNode
        }
      } catch {
        // If highlighting fails, leave the node unchanged
      }
    })
  }
}

function getTextContent(node: Element | Text): string {
  if (node.type === "text") {
    return node.value
  }
  if ("children" in node) {
    return node.children.map((child) => getTextContent(child as Element | Text)).join("")
  }
  return ""
}

function parseHighlightLines(meta: string): number[] {
  const match = /{([\d,-]+)}/.exec(meta)
  if (!match) return []

  const ranges = match[1].split(",")
  const lines: number[] = []

  for (const range of ranges) {
    if (range.includes("-")) {
      const [start, end] = range.split("-").map(Number)
      for (let i = start; i <= end; i++) {
        lines.push(i)
      }
    } else {
      lines.push(Number(range))
    }
  }

  return lines
}

function parseTitle(meta: string): string | undefined {
  const match = /title="([^"]+)"/.exec(meta)
  return match ? match[1] : undefined
}

interface CodeBlockOptions {
  lang: string
  lineNumbers: boolean
  highlightLines: number[]
  title?: string
}

/**
 * Builds inner HTML for a server-rendered code block.
 *
 * Structure (styled via structural selectors in CodeBlock.css.ts):
 *   [data-title]          — optional title bar
 *   div[data-lang]        — wrapper (position context for copy button)
 *     pre > code > .line  — Shiki output
 *     button[data-code]   — copy button
 */
function buildCodeBlockHtml(shikiHtml: string, options: CodeBlockOptions): string {
  const { lang, lineNumbers, highlightLines, title } = options

  let html = ""

  if (title) {
    html += `<div data-title>${escapeHtml(title)}</div>`
  }

  html += `<div data-lang="${lang}">`

  if (lineNumbers || highlightLines.length > 0) {
    const lines = shikiHtml.split("\n")
    const processedHtml = lines
      .map((line, i) => {
        const lineNum = i + 1
        const isHighlighted = highlightLines.includes(lineNum)
        const cls = isHighlighted ? "line highlighted" : "line"
        const lnAttr = lineNumbers ? ` data-ln="${lineNum}"` : ""

        return `<span class="${cls}"${lnAttr}>${line}</span>`
      })
      .join("\n")

    html += processedHtml
  } else {
    html += shikiHtml
  }

  html += `<button data-code="${encodeURIComponent(extractCodeFromHtml(shikiHtml))}">
    <span>Copy</span>
    <span style="display:none">Copied!</span>
  </button>`

  html += "</div>"

  return html
}

function extractCodeFromHtml(html: string): string {
  return html
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/**
 * Remark plugin that extracts code fence meta info and stores it as HAST
 * data attributes before MDX compilation can corrupt it.
 *
 * MDX treats `{...}` in code fence meta as JSX expressions, which corrupts
 * both the meta and the code content. This plugin strips the meta and
 * stores parsed info as `data-ardo-*` attributes that survive MDX.
 */
export function remarkCodeMeta() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (tree: any) {
    visit(tree, "code", (node: { meta?: null | string; data?: Record<string, unknown> }) => {
      if (!node.meta) return

      const meta = node.meta
      const data = node.data || (node.data = {})
      const hProperties = (data.hProperties as Record<string, unknown>) || {}

      // Preserve meta as metastring property on the <code> HAST element.
      // @shikijs/rehype reads head.properties.metastring and passes it
      // to Shiki as meta.__raw, which ardoLineTransformer reads.
      hProperties.metastring = meta
      data.hProperties = hProperties

      // Strip meta from the MDAST node to prevent MDX from
      // misinterpreting {expressions} like {2,4-5} as JSX
      node.meta = null
    })
  }
}

/**
 * Shiki transformer that adds line highlighting, line numbers, and title
 * attributes to code blocks in the MDX pipeline.
 *
 * Uses Shiki's built-in `.line` class for line spans. Highlighted lines
 * get `.highlighted`. Line numbers are added via `data-ln` attributes
 * (rendered with CSS `::before`).
 */
interface ArdoLineTransformerOptions {
  globalLineNumbers?: boolean
}

export function ardoLineTransformer(options: ArdoLineTransformerOptions = {}): ShikiTransformer {
  let highlightLines: number[] = []
  let showLineNumbers = false
  let metaRaw = ""

  return {
    name: "ardo:lines",
    // preprocess runs BEFORE line() hooks, so state is ready for line()
    preprocess(_code, shikiOptions) {
      metaRaw = shikiOptions.meta?.__raw! || ""
      highlightLines = parseHighlightLines(metaRaw)
      showLineNumbers = options.globalLineNumbers || metaRaw.includes("showLineNumbers")
    },
    // pre runs AFTER line() — used only for node property modifications
    pre(node) {
      node.properties = node.properties || {}
      const title = parseTitle(metaRaw)
      if (title) {
        node.properties["data-title"] = title
      }
      const labelMatch = /\[([^\]]+)]/.exec(metaRaw)
      if (labelMatch) {
        node.properties["data-label"] = labelMatch[1]
      }
    },
    line(node, line) {
      if (highlightLines.includes(line)) {
        const currentClass = (node.properties?.class as string) || ""
        node.properties = node.properties || {}
        node.properties.class = currentClass ? `${currentClass} highlighted` : "highlighted"
      }

      if (showLineNumbers) {
        node.properties = node.properties || {}
        node.properties["data-ln"] = String(line)
      }
    },
  }
}
