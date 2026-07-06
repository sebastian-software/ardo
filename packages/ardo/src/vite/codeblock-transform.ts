import type { MarkdownConfig } from "../config/types"

import { highlightCode } from "../markdown/shiki"
import { outdent, scanArdoCodeBlocks, type ScannedCodeBlock } from "./codeblock-scan"

export async function transformArdoCodeBlocks(
  source: string,
  markdownConfig?: MarkdownConfig,
  options: { sourcePath?: string } = {}
): Promise<string> {
  let result = source
  let offset = 0
  const blocks = scanArdoCodeBlocks(source)

  for (const block of blocks) {
    const replacement = await createReplacement(block, markdownConfig, options)
    if (replacement == null) {
      continue
    }

    const adjustedStart = block.start + offset
    const adjustedEnd = block.end + offset
    result = result.slice(0, adjustedStart) + replacement + result.slice(adjustedEnd)
    offset += replacement.length - block.fullMatch.length
  }

  return result
}

async function createReplacement(
  block: ScannedCodeBlock,
  markdownConfig: MarkdownConfig | undefined,
  options: { sourcePath?: string }
): Promise<null | string> {
  if (block.props.includes("__html")) {
    return null
  }

  if (block.children == null) {
    return createSelfClosingReplacement(block, markdownConfig, options)
  }

  return createChildrenReplacement(block, markdownConfig, options)
}

async function createSelfClosingReplacement(
  block: ScannedCodeBlock,
  markdownConfig: MarkdownConfig | undefined,
  options: { sourcePath?: string }
): Promise<null | string> {
  const codeValue = extractCodeValue(block.props)
  const language = extractPropValue(block.props, "language")
  if (codeValue == null || language == null) {
    return null
  }

  const html = await safeHighlightCode({
    codeContent: codeValue,
    language,
    markdownConfig,
    sourcePath: options.sourcePath,
  })
  if (html == null) {
    return null
  }

  const escapedHtml = JSON.stringify(html)
  const newProps = `__html={${escapedHtml}} ${block.props}`
  return block.fullMatch.replace(block.props, () => newProps)
}

async function createChildrenReplacement(
  block: ScannedCodeBlock,
  markdownConfig: MarkdownConfig | undefined,
  options: { sourcePath?: string }
): Promise<null | string> {
  const language = extractPropValue(block.props, "language")
  if (language == null || block.children == null) {
    return null
  }

  const rawChildren = unwrapTemplateChildren(block.children)
  const codeContent = outdent(rawChildren)
  const html = await safeHighlightCode({
    codeContent,
    language,
    markdownConfig,
    sourcePath: options.sourcePath,
  })
  if (html == null) {
    return null
  }

  const escapedHtml = JSON.stringify(html)
  const escapedCode = JSON.stringify(codeContent)
  return `<ArdoCodeBlock __html={${escapedHtml}} code={${escapedCode}} ${block.props} />`
}

function unwrapTemplateChildren(rawChildren: string): string {
  const trimmed = rawChildren.trim()
  if (!trimmed.startsWith("{`") || !trimmed.endsWith("`}")) {
    return rawChildren
  }

  return trimmed.slice(2, -2)
}

function extractCodeValue(props: string): null | string {
  const code = extractPropValue(props, "code")
  if (code == null) {
    return null
  }

  return decodeEscapedString(code)
}

function decodeEscapedString(value: string): string {
  return value.replaceAll(/\\(.)/gsu, (_match, character: string) => {
    if (character === "n") {
      return "\n"
    }

    return character
  })
}

function extractPropValue(props: string, propName: string): null | string {
  const patterns = getPropPatterns(propName)

  for (const pattern of patterns) {
    const match = pattern.exec(props)
    if (match?.[1] != null) {
      return match[1]
    }
  }

  return null
}

function getPropPatterns(propName: string): RegExp[] {
  return [
    new RegExp(`\\b${propName}="((?:[^"\\\\]|\\\\.)*)"`, "su"),
    new RegExp(`\\b${propName}=\\{\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*\\}`, "su"),
    new RegExp(`\\b${propName}=\\{\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*\\}`, "su"),
  ]
}

async function safeHighlightCode(params: {
  codeContent: string
  language: string
  markdownConfig: MarkdownConfig | undefined
  sourcePath?: string
}): Promise<null | string> {
  try {
    return await highlightCode(params.codeContent, params.language, {
      sourcePath: params.sourcePath,
      theme: params.markdownConfig?.theme,
    })
  } catch {
    return null
  }
}
