import type { MarkdownConfig } from "../config/types"

import { getJsxCompiler } from "../markdown/jsx-compiler"
import { outdent, scanArdoCodeBlocks, type ScannedCodeBlock } from "./codeblock-scan"

// eslint-disable-next-line @typescript-eslint/require-await -- Preserve the async prepass API with a synchronous native renderer.
export async function transformArdoCodeBlocks(
  source: string,
  markdownConfig?: MarkdownConfig,
  options: { sourcePath?: string } = {}
): Promise<string> {
  let result = source
  let offset = 0
  for (const block of scanArdoCodeBlocks(source)) {
    const replacement = createReplacement(block, markdownConfig, options)
    if (replacement == null) continue
    result = result.slice(0, block.start + offset) + replacement + result.slice(block.end + offset)
    offset += replacement.length - block.fullMatch.length
  }
  return result
}

function createReplacement(
  block: ScannedCodeBlock,
  markdownConfig: MarkdownConfig | undefined,
  options: { sourcePath?: string }
): null | string {
  const props = readProps(block.props)
  if (props == null || props.has("__html") || props.has("children")) return null
  const input = readCodeInput(block, props)
  const meta = readMeta(props)
  if (input == null || meta == null) return null
  try {
    const rendered = getJsxCompiler(markdownConfig).renderCodeBlock({ ...input, meta })
    // Defaults go before authored props so explicit title/label values win.
    const defaults = JSON.stringify({
      code: input.code,
      language: rendered.language ?? input.language,
      title: rendered.title,
      "data-label": rendered.label,
      lineNumbers: rendered.lineNumbers,
    })
    return `<ArdoCodeBlock {...${defaults}} ${block.props}>${rendered.jsx}</ArdoCodeBlock>`
  } catch (error) {
    console.warn(
      `[ardo] Could not render code block${options.sourcePath == null ? "" : ` in ${options.sourcePath}`}.`,
      error
    )
    return null
  }
}

function readCodeInput(block: ScannedCodeBlock, props: Map<string, string>) {
  const language = extractPropValue(props, "language")
  if (language == null) return null
  const children = block.children == null ? null : readLiteralChildren(block.children)
  if (block.children != null && children == null) return null
  const codeValue = extractPropValue(props, "code")
  if (props.has("code") && codeValue == null) return null
  const code = codeValue ?? (children == null ? null : outdent(children))
  return code == null ? null : { code, language }
}

function readMeta(props: Map<string, string>): null | string {
  const lineNumbers = readLineNumbers(props)
  const highlightLines = readHighlightLines(props)
  if (lineNumbers === null || highlightLines === null) return null
  const authoredMeta = extractPropValue(props, "meta")
  if (props.has("meta") && authoredMeta == null) return null
  let meta = authoredMeta ?? ""
  if (lineNumbers !== undefined) {
    meta = meta.replaceAll(/\b(?:showLineNumbers|noLineNumbers)\b/gu, "")
    meta += lineNumbers ? " showLineNumbers" : " noLineNumbers"
  }
  if (highlightLines !== undefined) {
    meta = meta.replaceAll(/\{[\d,\s-]+\}/gu, "")
    if (highlightLines.length > 0) meta += ` {${highlightLines.join(",")}}`
  }
  return meta
}

function readLiteralChildren(raw: string): null | string {
  const trimmed = raw.trim()
  if (trimmed.startsWith("{`") && trimmed.endsWith("`}")) {
    const value = trimmed.slice(2, -2)
    // Interpolated templates must keep their runtime evaluation.
    if (/(?<!\\)\$\{/u.test(value)) return null
    return decodeEscapedString(value)
  }
  if (trimmed.startsWith("{")) {
    const match = /^\{\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*\}$/su.exec(trimmed)
    return match == null ? null : decodeEscapedString(readCapture(match.slice(1)))
  }
  // Leave JSX children untouched, while retaining the prepass for raw samples.
  return trimmed.startsWith("<") ? null : raw
}

function readLineNumbers(props: Map<string, string>): boolean | null | undefined {
  const value = props.get("lineNumbers")
  if (value === undefined) return undefined
  if (value === "") return true
  const literal = /^\{\s*(true|false)\s*\}$/u.exec(value)
  return literal == null ? null : literal[1] === "true"
}

function readHighlightLines(props: Map<string, string>): null | number[] | undefined {
  const value = props.get("highlightLines")
  if (value === undefined) return undefined
  const literal = /^\{\s*\[([\d,\s]*)\]\s*\}$/u.exec(value)
  if (literal == null) return null
  return literal[1]
    .split(",")
    .filter((item) => item.trim() !== "")
    .map(Number)
}

/** Read top-level props conservatively; unsupported expressions stay authored. */
function readProps(source: string): Map<string, string> | null {
  const props = new Map<string, string>()

  const attribute =
    // eslint-disable-next-line security/detect-unsafe-regex -- Disjoint literal tokens, anchored at the current attribute.
    /\s*([\w-]+)(?:\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\{(?:[^{}"']|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')*\}))?(?=\s|$)/gsuy
  while (attribute.lastIndex < source.length) {
    const match = attribute.exec(source)
    if (match == null) return null // Includes spreads and nested/dynamic expressions.
    props.set(match[1], readCapture(match.slice(2)))
  }
  return props
}

function decodeEscapedString(value: string): string {
  return value.replaceAll(
    /\\(u\{[\da-f]+\}|u[\da-f]{4}|x[\da-f]{2}|\r?\n|.)/gisu,
    (_match, character: string) => {
      if (character.startsWith("u{"))
        return String.fromCodePoint(Number.parseInt(character.slice(2, -1), 16))
      if (character.startsWith("u") || character.startsWith("x"))
        return String.fromCharCode(Number.parseInt(character.slice(1), 16))
      if (character === "n") return "\n"
      if (character === "r") return "\r"
      if (character === "t") return "\t"
      if (character === "b") return "\b"
      if (character === "f") return "\f"
      if (character === "v") return "\v"
      if (character === "0") return "\0"
      if (character === "\n" || character === "\r\n") return ""
      return character
    }
  )
}

function extractPropValue(props: Map<string, string>, name: string): null | string {
  const value = props.get(name)
  if (value == null) return null
  const match =
    /^(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|\{\s*"((?:[^"\\]|\\.)*)"\s*\}|\{\s*'((?:[^'\\]|\\.)*)'\s*\})$/su.exec(
      value
    )
  if (match == null) return null
  const literal = readCapture(match.slice(1))
  if (value.startsWith("{")) return decodeEscapedString(literal)
  // Quoted JSX attributes preserve backslashes but decode character references.
  return literal.replaceAll(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/giu,
    (entity, entityName: string) => {
      if (entityName.startsWith("#")) {
        const point =
          entityName[1].toLowerCase() === "x"
            ? Number.parseInt(entityName.slice(2), 16)
            : Number(entityName.slice(1))
        return point <= 0x10_ff_ff ? String.fromCodePoint(point) : entity
      }
      return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[
        entityName.toLowerCase()
      ]
    }
  )
}

function readCapture(captures: Array<string | undefined>): string {
  return captures.find((capture) => capture !== undefined) ?? ""
}
