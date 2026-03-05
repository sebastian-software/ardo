export interface ScannedCodeBlock {
  children: null | string
  end: number
  fullMatch: string
  props: string
  start: number
}

const OPENING_TAG = "<ArdoCodeBlock"
const CLOSING_TAG = "</ArdoCodeBlock>"

/**
 * Strips leading/trailing blank lines and removes common leading whitespace.
 * Same logic as the runtime outdent in CodeBlock.tsx.
 */
export function outdent(text: string): string {
  const trimmedLines = trimBlankLines(text.split("\n"))
  if (trimmedLines.length === 0) {
    return ""
  }

  const commonIndent = getCommonIndent(trimmedLines)
  if (commonIndent === 0) {
    return trimmedLines.join("\n")
  }

  return trimmedLines.map((line) => stripIndent(line, commonIndent)).join("\n")
}

function trimBlankLines(lines: string[]): string[] {
  const result = [...lines]

  while (result.length > 0 && result[0].trim().length === 0) {
    result.shift()
  }

  while (result.length > 0 && result.at(-1)?.trim().length === 0) {
    result.pop()
  }

  return result
}

function getCommonIndent(lines: string[]): number {
  let minIndent = Number.POSITIVE_INFINITY

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue
    }

    const indent = getLeadingWhitespaceLength(line)
    if (indent < minIndent) {
      minIndent = indent
    }
  }

  return Number.isFinite(minIndent) ? minIndent : 0
}

function stripIndent(line: string, commonIndent: number): string {
  const availableIndent = getLeadingWhitespaceLength(line)
  const removeCount = Math.min(commonIndent, availableIndent)
  return line.slice(removeCount)
}

function getLeadingWhitespaceLength(line: string): number {
  let index = 0
  while (index < line.length) {
    const char = line[index]
    if (char !== " " && char !== "\t") {
      break
    }
    index++
  }
  return index
}

/**
 * Finds all `<ArdoCodeBlock ... />` and `<ArdoCodeBlock ...>...</ArdoCodeBlock>` tags
 * by scanning for balanced quotes and braces.
 */
export function scanArdoCodeBlocks(source: string): ScannedCodeBlock[] {
  const blocks: ScannedCodeBlock[] = []
  let cursor = 0

  while (cursor < source.length) {
    const scanResult = scanNextCodeBlock(source, cursor)
    if (scanResult == null) {
      break
    }

    const { block, nextCursor } = scanResult
    if (block != null) {
      blocks.push(block)
    }

    cursor = nextCursor
  }

  return blocks
}

function scanNextCodeBlock(
  source: string,
  cursor: number
): { block: null | ScannedCodeBlock; nextCursor: number } | null {
  const start = source.indexOf(OPENING_TAG, cursor)
  if (start === -1) {
    return null
  }

  const opening = scanOpeningTag(source, start)
  if (opening == null) {
    return { block: null, nextCursor: start + OPENING_TAG.length }
  }

  const block = createScannedBlock(source, start, opening)
  if (block == null) {
    return null
  }

  return { block, nextCursor: block.end }
}

interface OpeningTag {
  end: number
  isSelfClosing: boolean
  props: string
}

function scanOpeningTag(source: string, start: number): null | OpeningTag {
  const afterTag = start + OPENING_TAG.length
  if (!isWhitespaceChar(source[afterTag])) {
    return null
  }

  let index = afterTag
  let braceDepth = 0
  let quote: null | QuoteChar = null

  while (index < source.length) {
    const step = advanceOpeningTagScan(source, {
      braceDepth,
      index,
      quote,
    })
    if (step.tagEndIndex != null) {
      return finalizeOpeningTag(source, afterTag, step.tagEndIndex)
    }

    index = step.nextIndex
    braceDepth = step.nextBraceDepth
    quote = step.nextQuote
  }

  return null
}

function finalizeOpeningTag(source: string, afterTag: number, endBracketIndex: number): OpeningTag {
  const isSelfClosing = source[endBracketIndex - 1] === "/"
  const propsEnd = isSelfClosing ? endBracketIndex - 1 : endBracketIndex
  const props = source.slice(afterTag, propsEnd).trim()

  return {
    end: endBracketIndex + 1,
    isSelfClosing,
    props,
  }
}

type QuoteChar = "'" | '"' | "`"

interface OpeningTagScanStep {
  nextBraceDepth: number
  nextIndex: number
  nextQuote: null | QuoteChar
  tagEndIndex: null | number
}

interface ScanCursorState {
  braceDepth: number
  index: number
  quote: null | QuoteChar
}

function advanceOpeningTagScan(source: string, state: ScanCursorState): OpeningTagScanStep {
  const { braceDepth, index, quote } = state
  if (quote != null) {
    return scanQuotedStep(source, {
      braceDepth,
      index,
      quote,
    })
  }

  return scanUnquotedStep(source, index, braceDepth)
}

function scanQuotedStep(source: string, state: ScanCursorState): OpeningTagScanStep {
  const { braceDepth, index, quote } = state
  if (source[index] === "\\") {
    return {
      nextBraceDepth: braceDepth,
      nextIndex: Math.min(source.length, index + 2),
      nextQuote: quote,
      tagEndIndex: null,
    }
  }

  const closesQuote = source[index] === quote
  return {
    nextBraceDepth: braceDepth,
    nextIndex: index + 1,
    nextQuote: closesQuote ? null : quote,
    tagEndIndex: null,
  }
}

function scanUnquotedStep(source: string, index: number, braceDepth: number): OpeningTagScanStep {
  const char = source[index]
  if (isQuote(char)) {
    return makeScanStep(index + 1, braceDepth, char)
  }

  if (char === "{") {
    return makeScanStep(index + 1, braceDepth + 1, null)
  }

  if (char === "}") {
    return makeScanStep(index + 1, Math.max(0, braceDepth - 1), null)
  }

  if (braceDepth === 0 && char === ">") {
    return {
      nextBraceDepth: braceDepth,
      nextIndex: index + 1,
      nextQuote: null,
      tagEndIndex: index,
    }
  }

  return makeScanStep(index + 1, braceDepth, null)
}

function makeScanStep(
  nextIndex: number,
  nextBraceDepth: number,
  nextQuote: null | QuoteChar
): OpeningTagScanStep {
  return {
    nextBraceDepth,
    nextIndex,
    nextQuote,
    tagEndIndex: null,
  }
}

function createScannedBlock(
  source: string,
  start: number,
  opening: OpeningTag
): null | ScannedCodeBlock {
  if (opening.isSelfClosing) {
    return {
      children: null,
      end: opening.end,
      fullMatch: source.slice(start, opening.end),
      props: opening.props,
      start,
    }
  }

  const closeStart = source.indexOf(CLOSING_TAG, opening.end)
  if (closeStart === -1) {
    return null
  }

  const end = closeStart + CLOSING_TAG.length
  return {
    children: source.slice(opening.end, closeStart),
    end,
    fullMatch: source.slice(start, end),
    props: opening.props,
    start,
  }
}

function isQuote(char: string): char is QuoteChar {
  return char === '"' || char === "'" || char === "`"
}

function isWhitespaceChar(char: string | undefined): boolean {
  return char === " " || char === "\n" || char === "\r" || char === "\t"
}
