type ComponentTagStripResult = {
  content: string
  isInsideComponentTag: boolean
}

type MdxLineStripResult = {
  content: null | string
  isInsideComponentTag: boolean
}

type ComponentTagScannerState = {
  index: number
  isInsideComponentTag: boolean
  result: string
}

/**
 * Remove MDX-only syntax (import/export lines and component tags) from prose
 * while leaving fenced code blocks and inline code spans untouched.
 */
export function stripMdxSyntaxOutsideCodeFences(content: string): string {
  const lines: string[] = []
  let isInsideFence = false
  let isInsideComponentTag = false

  for (const line of content.split("\n")) {
    const fenceState = getNextFenceState(line, isInsideFence)
    if (fenceState != null) {
      lines.push(line)
      isInsideFence = fenceState
      continue
    }

    const stripped = stripMdxLine(line, isInsideComponentTag)
    isInsideComponentTag = stripped.isInsideComponentTag
    if (stripped.content !== null) lines.push(stripped.content)
  }

  return lines.join("\n")
}

function getNextFenceState(line: string, isInsideFence: boolean): boolean | null {
  if (line.trimStart().startsWith("```")) {
    return !isInsideFence
  }

  return isInsideFence ? true : null
}

function stripMdxLine(line: string, isInsideComponentTag: boolean): MdxLineStripResult {
  if (isMdxModuleLine(line)) {
    return { content: null, isInsideComponentTag }
  }

  return stripComponentTags(line, isInsideComponentTag)
}

function isMdxModuleLine(line: string): boolean {
  const trimmed = line.trimStart()
  return trimmed.startsWith("import ") || trimmed.startsWith("export ")
}

function stripComponentTags(
  content: string,
  isInsideComponentTag: boolean
): ComponentTagStripResult {
  const state: ComponentTagScannerState = { index: 0, isInsideComponentTag, result: "" }

  while (state.index < content.length) {
    advanceComponentTagScanner(content, state)
  }

  return { content: state.result, isInsideComponentTag: state.isInsideComponentTag }
}

function advanceComponentTagScanner(content: string, state: ComponentTagScannerState): void {
  if (state.isInsideComponentTag) {
    advanceInsideComponentTag(content, state)
    return
  }

  if (isInlineCodeStart(content, state.index)) {
    advancePastInlineCode(content, state)
    return
  }

  if (isComponentTagStart(content, state.index)) {
    advancePastComponentTag(content, state)
    return
  }

  state.result += content[state.index] ?? ""
  state.index++
}

function isInlineCodeStart(content: string, index: number): boolean {
  return content[index] === "`"
}

function advancePastInlineCode(content: string, state: ComponentTagScannerState): void {
  let runLength = 0
  while (content[state.index + runLength] === "`") {
    runLength++
  }

  const closeIndex = findClosingBacktickRun(content, state.index + runLength, runLength)
  if (closeIndex === -1) {
    state.result += "`".repeat(runLength)
    state.index += runLength
    return
  }

  const end = closeIndex + runLength
  state.result += content.slice(state.index, end)
  state.index = end
}

function findClosingBacktickRun(content: string, fromIndex: number, runLength: number): number {
  let index = fromIndex
  while (index < content.length) {
    if (content[index] !== "`") {
      index++
      continue
    }

    let length = 0
    while (content[index + length] === "`") {
      length++
    }

    if (length === runLength) {
      return index
    }

    index += length
  }

  return -1
}

function advanceInsideComponentTag(content: string, state: ComponentTagScannerState): void {
  const end = content.indexOf(">", state.index)
  if (end === -1) {
    state.index = content.length
    return
  }

  state.index = end + 1
  state.isInsideComponentTag = false
}

function advancePastComponentTag(content: string, state: ComponentTagScannerState): void {
  const end = content.indexOf(">", state.index + 1)
  if (end === -1) {
    state.index = content.length
    state.isInsideComponentTag = true
    return
  }

  state.index = end + 1
}

function isComponentTagStart(content: string, index: number): boolean {
  if (content[index] !== "<") {
    return false
  }

  const next = content.charAt(index + 1)
  if (next === "") {
    return false
  }

  if (isUppercaseAscii(next)) {
    return true
  }

  return next === "/" && isUppercaseAscii(content.charAt(index + 2))
}

function isUppercaseAscii(character: string): boolean {
  return character >= "A" && character <= "Z"
}
