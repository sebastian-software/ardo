import type { Element, Root, Text } from "hast"
import type { Highlighter } from "shiki"

import { visit } from "unist-util-visit"

import type { MarkdownConfig } from "../config/types"

import { shikiContainer } from "../ui/components/CodeBlock.css"
import { buildCodeBlockHtml } from "./shiki-html"
import { parseHighlightLines, parseTitle } from "./shiki-meta"
import { highlightWithTheme, resolveThemeConfig } from "./shiki-theme"

interface RehypeShikiOptions {
  config: MarkdownConfig
  highlighter: Highlighter
}

interface TransformCodeNodeContext {
  config: MarkdownConfig
  highlighter: Highlighter
  index: number | undefined
  node: Element
  parent: unknown
  themeConfig: MarkdownConfig["theme"]
}

export function rehypeShikiFromHighlighter(options: RehypeShikiOptions) {
  const themeConfig = resolveThemeConfig(options.config.theme)

  return function (tree: Root): void {
    visit(tree, "element", (node: Element, index, parent) => {
      transformCodeNode({
        config: options.config,
        highlighter: options.highlighter,
        index,
        node,
        parent,
        themeConfig,
      })
    })
  }
}

function transformCodeNode(context: TransformCodeNodeContext): void {
  const codeNode = getCodeNode(context.node)
  if (codeNode == null) {
    return
  }

  const codeContent = getTextContent(codeNode)
  if (codeContent.trim().length === 0) {
    return
  }

  const metaString = getMetaString(codeNode)
  const language = getLanguage(codeNode)
  const innerHtml = tryRenderHighlightedHtml({
    codeContent,
    context,
    language,
    metaString,
  })
  if (innerHtml == null) {
    return
  }

  replaceNodeWithShikiContainer(context.parent, context.index, innerHtml)
}

function tryRenderHighlightedHtml(params: {
  codeContent: string
  context: TransformCodeNodeContext
  language: string
  metaString: string
}): null | string {
  const { codeContent, context, language, metaString } = params
  try {
    const html = highlightWithTheme({
      code: codeContent,
      highlighter: context.highlighter,
      language,
      themeConfig: context.themeConfig,
    })

    return buildCodeBlockHtml(html, {
      highlightLines: parseHighlightLines(metaString),
      lang: language,
      lineNumbers: (context.config.lineNumbers ?? false) || metaString.includes("showLineNumbers"),
      title: parseTitle(metaString),
    })
  } catch {
    return null
  }
}

function getCodeNode(node: Element): Element | null {
  if (node.tagName !== "pre") {
    return null
  }

  const firstChild = node.children.at(0)
  if (!isElementNode(firstChild) || firstChild.tagName !== "code") {
    return null
  }

  return firstChild
}

function isElementNode(node: unknown): node is Element {
  return isRecord(node) && node.type === "element"
}

function getMetaString(codeNode: Element): string {
  const properties = toRecord(codeNode.properties)
  return typeof properties.metastring === "string" ? properties.metastring : ""
}

function getLanguage(codeNode: Element): string {
  const properties = toRecord(codeNode.properties)
  const classNames = toClassNameList(properties.className)
  const languageClass = classNames.find((className) => className.startsWith("language-"))

  return languageClass == null ? "text" : languageClass.replace("language-", "")
}

function toClassNameList(className: unknown): string[] {
  if (Array.isArray(className)) {
    return className.filter((entry): entry is string => typeof entry === "string")
  }

  if (typeof className === "string") {
    return [className]
  }

  return []
}

function getTextContent(node: Element | Text): string {
  if (node.type === "text") {
    return node.value
  }

  const parts: string[] = []
  for (const child of node.children) {
    if (child.type === "text" || child.type === "element") {
      parts.push(getTextContent(child))
    }
  }

  return parts.join("")
}

function replaceNodeWithShikiContainer(
  parent: unknown,
  index: number | undefined,
  innerHtml: string
): void {
  if (index == null || !hasChildrenArray(parent)) {
    return
  }

  parent.children[index] = {
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
  } satisfies Element
}

function hasChildrenArray(value: unknown): value is { children: unknown[] } {
  return isRecord(value) && Array.isArray(value.children)
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}
