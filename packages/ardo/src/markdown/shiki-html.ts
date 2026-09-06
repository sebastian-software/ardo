import type { Element, Root, Text } from "hast"

type CodeBlockOptions = {
  highlightLines: number[]
  label?: string
  lang: string
  lineNumbers: boolean
  title?: string
}

export function buildCodeBlockHtml(shikiHtml: string, options: CodeBlockOptions): string {
  const titleHtml = renderTitle(options.title)
  const codeHtml = renderCodeLines({
    highlightLines: options.highlightLines,
    lineNumbers: options.lineNumbers,
    shikiHtml,
  })
  const copyButton = renderCopyButton(shikiHtml)

  return `${titleHtml}<div data-lang="${options.lang}">${codeHtml}${copyButton}</div>`
}

export function buildCodeBlockHast(
  highlighted: Root,
  code: string,
  options: CodeBlockOptions
): Element {
  const pre = highlighted.children.find(isElementNode)
  if (pre?.tagName !== "pre") {
    throw new Error("Ferriki returned an invalid highlighted code block")
  }

  const codeNode = pre.children.find(
    (child): child is Element => isElementNode(child) && child.tagName === "code"
  )
  if (codeNode == null) {
    throw new Error("Ferriki returned a code block without a code element")
  }

  decorateCodeLines(codeNode, options.highlightLines, options.lineNumbers)

  const codeContainer: Element = {
    type: "element",
    tagName: "div",
    properties: {
      "data-lang": options.lang,
      ...(options.label == null ? {} : { "data-label": options.label }),
    },
    children: [pre, renderCopyButtonHast(code)],
  }

  const children: Array<Element | Text> = [codeContainer]
  if (options.title != null && options.title.length > 0) {
    children.unshift({
      type: "element",
      tagName: "div",
      properties: { "data-title": true },
      children: [{ type: "text", value: options.title }],
    })
  }

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["ardo-shiki"] },
    children,
  }
}

function decorateCodeLines(
  codeNode: Element,
  highlightLines: number[],
  lineNumbers: boolean
): void {
  let lineNumber = 0
  for (const child of codeNode.children) {
    if (!isLineNode(child)) {
      continue
    }

    lineNumber += 1
    decorateCodeLine(child, lineNumber, { highlightLines, lineNumbers })
  }
}

function isLineNode(node: unknown): node is Element {
  if (!isElementNode(node) || node.tagName !== "span") {
    return false
  }

  const properties = isRecord(node.properties) ? node.properties : {}
  return toClassNameList(properties.class ?? properties.className).includes("line")
}

function decorateCodeLine(
  node: Element,
  lineNumber: number,
  options: { highlightLines: number[]; lineNumbers: boolean }
): void {
  const properties = isRecord(node.properties) ? node.properties : {}
  const classes = toClassNameList(properties.class ?? properties.className)
  if (options.highlightLines.includes(lineNumber) && !classes.includes("highlighted")) {
    classes.push("highlighted")
  }
  properties.class = classes.join(" ")
  if (options.lineNumbers) {
    properties["data-ln"] = String(lineNumber)
  }
  node.properties = properties
}

function renderCopyButtonHast(code: string): Element {
  return {
    type: "element",
    tagName: "button",
    properties: { "data-code": encodeURIComponent(code) },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {},
        children: [{ type: "text", value: "Copy" }],
      },
      {
        type: "element",
        tagName: "span",
        properties: { style: "display:none" },
        children: [{ type: "text", value: "Copied!" }],
      },
    ],
  }
}

function isElementNode(node: unknown): node is Element {
  return isRecord(node) && node.type === "element"
}

function toClassNameList(className: unknown): string[] {
  if (Array.isArray(className)) {
    return className.filter((entry): entry is string => typeof entry === "string")
  }
  return typeof className === "string" ? [className] : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

function renderTitle(title: string | undefined): string {
  if (title == null || title.length === 0) {
    return ""
  }

  return `<div data-title>${escapeHtml(title)}</div>`
}

function renderCodeLines(params: {
  highlightLines: number[]
  lineNumbers: boolean
  shikiHtml: string
}): string {
  const { highlightLines, lineNumbers, shikiHtml } = params
  if (!lineNumbers && highlightLines.length === 0) {
    return shikiHtml
  }

  return shikiHtml
    .split("\n")
    .map((lineHtml, index) =>
      renderSingleCodeLine({
        highlightLines,
        lineHtml,
        lineNumber: index + 1,
        lineNumbers,
      })
    )
    .join("\n")
}

function renderSingleCodeLine(params: {
  highlightLines: number[]
  lineHtml: string
  lineNumber: number
  lineNumbers: boolean
}): string {
  const { highlightLines, lineHtml, lineNumber, lineNumbers } = params
  const isHighlighted = highlightLines.includes(lineNumber)
  const className = isHighlighted ? "line highlighted" : "line"
  const lineNumberAttribute = lineNumbers ? ` data-ln="${lineNumber}"` : ""

  return `<span class="${className}"${lineNumberAttribute}>${lineHtml}</span>`
}

function renderCopyButton(shikiHtml: string): string {
  const code = encodeURIComponent(extractCodeFromHtml(shikiHtml))
  return `<button data-code="${code}">
    <span>Copy</span>
    <span style="display:none">Copied!</span>
  </button>`
}

function extractCodeFromHtml(html: string): string {
  return decodeCommonEntities(stripTags(html))
}

function stripTags(html: string): string {
  let result = ""
  let inTag = false

  for (const char of html) {
    if (char === "<") {
      inTag = true
      continue
    }

    if (inTag && char === ">") {
      inTag = false
      continue
    }

    if (!inTag) {
      result += char
    }
  }

  return result
}

function decodeCommonEntities(text: string): string {
  return text
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
