type FrontmatterReadResult =
  | {
      found: false
      nextIndex: number
    }
  | {
      found: true
      value: string | undefined
    }

export function extractFrontmatterValue(code: string, key: string): string | undefined {
  // Compiled route modules keep their frontmatter in `_ardoFrontmatter`; an
  // authored MDX export stays `frontmatter`.
  const markers = ["export const frontmatter", "const _ardoFrontmatter"]
  const frontmatterStart = markers
    .map((marker) => code.indexOf(marker))
    .find((index) => index !== -1)
  if (frontmatterStart == null) {
    return undefined
  }

  const frontmatterCode = code.slice(frontmatterStart)
  return findFrontmatterStringValue(frontmatterCode, key)
}

function findFrontmatterStringValue(code: string, key: string): string | undefined {
  // Compiled modules serialize frontmatter as JSON, with quoted keys.
  return findStringValue(code, `${key}:`) ?? findStringValue(code, `"${key}":`)
}

function findStringValue(code: string, keyPrefix: string): string | undefined {
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
