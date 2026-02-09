import {
  createHighlighter,
  type Highlighter,
  type BundledTheme,
  type ShikiTransformer,
} from "shiki"
import type { Root, Element, Text } from "hast"
import { visit } from "unist-util-visit"
import type { MarkdownConfig } from "../config/types"

export type ShikiHighlighter = Highlighter

export async function createShikiHighlighter(config: MarkdownConfig): Promise<ShikiHighlighter> {
  const themeConfig = config.theme ?? {
    light: "github-light",
    dark: "github-dark",
  }

  const themes: BundledTheme[] =
    typeof themeConfig === "string" ? [themeConfig] : [themeConfig.light, themeConfig.dark]

  const highlighter = await createHighlighter({
    themes,
    langs: [
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "json",
      "html",
      "css",
      "markdown",
      "bash",
      "shell",
      "yaml",
      "python",
      "rust",
      "go",
      "sql",
      "diff",
    ],
  })

  return highlighter
}

interface RehypeShikiOptions {
  highlighter: ShikiHighlighter
  config: MarkdownConfig
}

export function rehypeShikiFromHighlighter(options: RehypeShikiOptions) {
  const { highlighter, config } = options

  const themeConfig = config.theme ?? {
    light: "github-light",
    dark: "github-dark",
  }

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

        const wrapperHtml = buildCodeBlockHtml(html, {
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
              className: ["ardo-code-block"],
              "data-lang": lang,
            },
            children: [
              {
                type: "raw",
                value: wrapperHtml,
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
  const match = meta.match(/\{([\d,-]+)\}/)
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
  const match = meta.match(/title="([^"]+)"/)
  return match ? match[1] : undefined
}

interface CodeBlockOptions {
  lang: string
  lineNumbers: boolean
  highlightLines: number[]
  title?: string
}

function buildCodeBlockHtml(shikiHtml: string, options: CodeBlockOptions): string {
  const { lang, lineNumbers, highlightLines, title } = options

  let html = ""

  if (title) {
    html += `<div class="ardo-code-title">${escapeHtml(title)}</div>`
  }

  html += `<div class="ardo-code-wrapper" data-lang="${lang}">`

  if (lineNumbers || highlightLines.length > 0) {
    const lines = shikiHtml.split("\n")
    const processedHtml = lines
      .map((line, i) => {
        const lineNum = i + 1
        const isHighlighted = highlightLines.includes(lineNum)
        const classes = ["ardo-code-line"]
        if (isHighlighted) classes.push("highlighted")

        let prefix = ""
        if (lineNumbers) {
          prefix = `<span class="ardo-line-number">${lineNum}</span>`
        }

        return `<span class="${classes.join(" ")}">${prefix}${line}</span>`
      })
      .join("\n")

    html += processedHtml
  } else {
    html += shikiHtml
  }

  html += `<button class="ardo-copy-button" data-code="${encodeURIComponent(extractCodeFromHtml(shikiHtml))}">
    <span class="ardo-copy-icon">Copy</span>
    <span class="ardo-copied-icon" style="display:none">Copied!</span>
  </button>`

  html += "</div>"

  return html
}

function extractCodeFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
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
    visit(tree, "code", (node: { meta?: string | null; data?: Record<string, unknown> }) => {
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
 * Shiki transformer that adds Ardo-specific line classes, highlighting,
 * line numbers, and title attributes to code blocks.
 *
 * Used with @shikijs/rehype in the MDX pipeline where proper HAST nodes
 * are required (raw HTML nodes cause "Cannot handle unknown node `raw`" errors).
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
      metaRaw = (shikiOptions.meta?.__raw as string) || ""
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
      const labelMatch = metaRaw.match(/\[([^\]]+)\]/)
      if (labelMatch) {
        node.properties["data-label"] = labelMatch[1]
      }
    },
    line(node, line) {
      const currentClass = (node.properties?.class as string) || ""
      const classes = currentClass ? currentClass.split(" ") : []
      classes.push("ardo-code-line")

      if (highlightLines.includes(line)) {
        classes.push("highlighted")
      }

      node.properties = node.properties || {}
      node.properties.class = classes.join(" ")

      if (showLineNumbers) {
        node.children.unshift({
          type: "element",
          tagName: "span",
          properties: { class: "ardo-line-number" },
          children: [{ type: "text", value: String(line) }],
        } as Element)
      }
    },
  }
}
