const GENERATED_FRONTMATTER = "const _ardoFrontmatter = "

type FrontmatterReadResult =
  | {
      found: false
      nextIndex: number
    }
  | {
      found: true
      value: string | undefined
    }

/** Reads one string value from a route module's frontmatter. */
export function extractFrontmatterValue(code: string, key: string): string | undefined {
  const generated = readGeneratedFrontmatter(code)
  if (generated !== undefined) {
    const value = generated[key]
    return typeof value === "string" ? value : undefined
  }

  const frontmatterStart = code.indexOf("export const frontmatter")
  if (frontmatterStart === -1) {
    return undefined
  }

  const frontmatterCode = code.slice(frontmatterStart)
  return findFrontmatterStringValue(frontmatterCode, key)
}

function findFrontmatterStringValue(code: string, key: string): string | undefined {
  const keyPrefix = `${key}:`
  let searchIndex = 0

  while (searchIndex < code.length) {
    const keyIndex = code.indexOf(keyPrefix, searchIndex)
    if (keyIndex === -1) {
      return undefined
    }

    const result = readFrontmatterStringAtKey(code, keyIndex, keyPrefix)
    if (result.found) {
      return result.value
    }

    searchIndex = result.nextIndex
  }

  return undefined
}

function readFrontmatterStringAtKey(
  code: string,
  keyIndex: number,
  keyPrefix: string
): FrontmatterReadResult {
  if (!hasFrontmatterKeyBoundary(code, keyIndex)) {
    return { found: false, nextIndex: keyIndex + keyPrefix.length }
  }

  const valueIndex = skipWhitespace(code, keyIndex + keyPrefix.length)
  if (code[valueIndex] !== '"') {
    return { found: false, nextIndex: valueIndex + 1 }
  }

  return { found: true, value: parseQuotedFrontmatterString(code, valueIndex) }
}

function hasFrontmatterKeyBoundary(code: string, keyIndex: number): boolean {
  if (keyIndex === 0) {
    return true
  }

  const previous = code[keyIndex - 1]
  return previous === "{" || previous === "," || isWhitespace(previous)
}

function isWhitespace(value: string | undefined): boolean {
  return value === " " || value === "\n" || value === "\r" || value === "\t"
}

function skipWhitespace(code: string, startIndex: number): number {
  let index = startIndex
  while (isWhitespace(code[index])) {
    index += 1
  }
  return index
}

function parseQuotedFrontmatterString(code: string, quoteIndex: number): string | undefined {
  let index = quoteIndex + 1
  let escaped = false

  while (index < code.length) {
    const char = code[index]
    if (char === '"' && !escaped) {
      return parseJsonString(code.slice(quoteIndex, index + 1))
    }

    escaped = char === "\\" && !escaped
    if (char !== "\\") {
      escaped = false
    }
    index += 1
  }

  return undefined
}

function parseJsonString(value: string): string | undefined {
  try {
    const parsedValue: unknown = JSON.parse(value)
    return typeof parsedValue === "string" ? parsedValue : undefined
  } catch {
    return undefined
  }
}

/**
 * Compiled routes bind their frontmatter as `const _ardoFrontmatter = {…}`,
 * which mdx-compile writes with JSON.stringify, and export it under an alias.
 * Read that object as JSON. A document that binds its own `frontmatter` gets
 * `= frontmatter;` here and falls back to the authored export below.
 */
function readGeneratedFrontmatter(code: string): Record<string, unknown> | undefined {
  const markerIndex = code.indexOf(GENERATED_FRONTMATTER)
  if (markerIndex === -1) return undefined
  const objectStart = markerIndex + GENERATED_FRONTMATTER.length
  if (code[objectStart] !== "{") return undefined
  const objectEnd = findObjectEnd(code, objectStart)
  if (objectEnd === -1) return undefined
  try {
    const value: unknown = JSON.parse(code.slice(objectStart, objectEnd + 1))
    return isRecord(value) ? value : undefined
  } catch {
    return undefined
  }
}

/** Index of the brace that closes the JSON object starting at `start`, or -1. */
function findObjectEnd(code: string, start: number): number {
  let depth = 0
  let inString = false
  for (let index = start; index < code.length; index++) {
    const char = code[index]
    if (inString) {
      if (char === "\\") index++
      else if (char === '"') inString = false
    } else if (char === '"') {
      inString = true
    } else if (char === "{" || char === "[") {
      depth++
    } else if (char === "}" || char === "]") {
      depth--
      if (depth === 0) return index
    }
  }
  return -1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
