type FrontmatterReadResult =
  | {
      found: false
      nextIndex: number
    }
  | {
      found: true
      value: string | undefined
    }

// Compiled route modules keep their frontmatter in `_ardoFrontmatter`; an
// authored MDX export stays `frontmatter`.
const FRONTMATTER_MARKERS = ["export const frontmatter", "const _ardoFrontmatter"]

export function extractFrontmatterValue(code: string, key: string): string | undefined {
  const frontmatterStart = findFrontmatterStart(code)
  if (frontmatterStart == null) {
    return undefined
  }

  const frontmatterCode = code.slice(frontmatterStart)
  return findFrontmatterStringValue(frontmatterCode, key)
}

// Ardo's own declaration, which mdx-compile appends after the compiled body.
const ARDO_FRONTMATTER_DECLARATION = "const _ardoFrontmatter = "

/**
 * A string value of a top-level key of a compiled route's `_ardoFrontmatter`
 * object. Unlike {@link extractFrontmatterValue}, nested values such as a
 * publication post's `_ardoPost` and its author profiles are never read, and
 * text in the post body, such as `export const frontmatter` in a code block,
 * is never taken for the frontmatter.
 */
export function extractTopLevelFrontmatterValue(code: string, key: string): string | undefined {
  const frontmatterStart = findArdoFrontmatterStart(code)
  if (frontmatterStart == null) {
    return undefined
  }

  const assignment = code.indexOf("=", frontmatterStart)
  const objectStart = assignment === -1 ? -1 : skipWhitespace(code, assignment + 1)
  if (objectStart === -1 || code[objectStart] !== "{") {
    return undefined
  }

  return findTopLevelStringValue(code, objectStart, key)
}

function findFrontmatterStart(code: string): number | undefined {
  return FRONTMATTER_MARKERS.map((marker) => code.indexOf(marker)).find((index) => index !== -1)
}

/**
 * The start of Ardo's `_ardoFrontmatter` declaration. It follows all compiled
 * body output, and Ferromark rejects an authored binding of that name, so the
 * last occurrence at the start of a line is Ardo's. No later line starts with
 * the declaration: the generated values after it are either on a single line
 * or, once `transformWithOxc` prints them across several lines, indented, and
 * their JSON strings contain no raw newlines. Text such as a heading in
 * `_ardoToc` therefore never starts a line there.
 */
function findArdoFrontmatterStart(code: string): number | undefined {
  let index = code.lastIndexOf(ARDO_FRONTMATTER_DECLARATION)
  while (index > 0 && code[index - 1] !== "\n") {
    index = code.lastIndexOf(ARDO_FRONTMATTER_DECLARATION, index - 1)
  }
  return index === -1 ? undefined : index
}

/** Walk the object literal at `objectStart`, skipping strings and nested values. */
function findTopLevelStringValue(
  code: string,
  objectStart: number,
  key: string
): string | undefined {
  const keyPrefixes = [`"${key}":`, `${key}:`]
  let depth = 0
  let index = objectStart

  while (index < code.length) {
    const keyPrefix = depth === 1 ? findKeyPrefixAt(code, index, keyPrefixes) : undefined
    if (keyPrefix != null) {
      const result = readFrontmatterStringAtKey(code, index, keyPrefix)
      return result.found ? result.value : undefined
    }

    depth += depthChange(code[index])
    if (depth === 0) {
      return undefined
    }
    index = isQuote(code[index]) ? findStringEnd(code, index) + 1 : index + 1
  }

  return undefined
}

function findKeyPrefixAt(code: string, index: number, keyPrefixes: string[]): string | undefined {
  const keyPrefix = keyPrefixes.find((prefix) => code.startsWith(prefix, index))
  return keyPrefix != null && hasFrontmatterKeyBoundary(code, index) ? keyPrefix : undefined
}

function depthChange(char: string | undefined): number {
  if (char === "{" || char === "[") {
    return 1
  }
  return char === "}" || char === "]" ? -1 : 0
}

function isQuote(char: string | undefined): boolean {
  return char === '"' || char === "'" || char === "`"
}

/** Index of the quote that closes the string starting at `quoteIndex`. */
function findStringEnd(code: string, quoteIndex: number): number {
  const quote = code[quoteIndex]
  let index = quoteIndex + 1
  while (index < code.length) {
    if (code[index] === "\\") {
      index += 2
      continue
    }
    if (code[index] === quote) {
      return index
    }
    index += 1
  }
  return code.length
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
