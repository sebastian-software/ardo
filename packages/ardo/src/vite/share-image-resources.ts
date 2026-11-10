// Ignore XML text, comments, and CDATA while finding tags. Quoted > characters stay inside tags.
const XML_MARKUP =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype\b|<\?[\s\S]*?\?>|<(\/?)([a-z_][\w:.-]*)(?:[^"'<>]|"[^"]*"|'[^']*')*>/giu
const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }
const ATTRIBUTES = /([\w:.-]+)\s*=\s*(["'])([\s\S]*?)\2/gu
const CSS_PROPERTIES = new Set([
  "style",
  "fill",
  "stroke",
  "filter",
  "clip-path",
  "mask",
  "cursor",
  "marker",
  "marker-start",
  "marker-mid",
  "marker-end",
  "color-profile",
])
// CSS comments and strings are single tokens; identifiers may contain CSS escapes.
const CSS_TOKENS =
  /\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|(@?)((?:[\p{L}_-]|\\(?:[\da-f]{1,6}\s?|[^\r\n]))(?:[\p{L}\p{N}_-]|\\(?:[\da-f]{1,6}\s?|[^\r\n]))*)/giu
const CSS_URL = /^\(\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|([^)]*?))\s*\)/u

/** Validate actual SVG resource locations, without interpreting visible copy as CSS. */
export function assertSelfContained(svg: string): void {
  if (typeof svg !== "string") rejectResource()
  let styleStart: number | undefined
  for (const match of svg.matchAll(XML_MARKUP)) {
    const tag = match[0]
    if (/^<!doctype/iu.test(tag)) rejectResource()
    if (tag.startsWith("<!")) continue
    checkAttributes(tag)
    if (match[2]?.split(":").at(-1)?.toLowerCase() !== "style") continue
    if (match[1] === "/") {
      if (styleStart != null)
        checkCss(
          decodeXml(
            svg
              .slice(styleStart, match.index)
              .replaceAll(/<!--[\s\S]*?-->/gu, "")
              .replaceAll(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1")
          )
        )
      styleStart = undefined
    } else if (!tag.endsWith("/>")) styleStart = match.index + tag.length
  }
}

function checkAttributes(tag: string): void {
  for (const match of tag.matchAll(ATTRIBUTES)) {
    const name = match[1].toLowerCase()
    const value = decodeXml(match[3])
    if (!name.startsWith("xmlns:") && (name === "href" || name.endsWith(":href"))) checkUrl(value)
    else if (CSS_PROPERTIES.has(name)) checkCss(value)
  }
}

function checkCss(css: string): void {
  const tokens = new RegExp(CSS_TOKENS)
  for (let token = tokens.exec(css); token != null; token = tokens.exec(css)) {
    if (token[2] == null) continue
    const name = decodeCss(token[2]).toLowerCase()
    if (token[1] === "@" && name === "import") rejectResource()
    if (token[1] !== "" || name !== "url") continue
    const url = CSS_URL.exec(css.slice(tokens.lastIndex))
    if (url == null) continue
    checkUrl(decodeCss(url[1] ?? url[2] ?? url[3]))
    tokens.lastIndex += url[0].length
  }
}

function checkUrl(value: string): void {
  const url = value.trim()
  if (!url.startsWith("data:") && !url.startsWith("#")) rejectResource()
}

function decodeXml(value: string): string {
  return value.replaceAll(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/giu, (entity, name: string) => {
    if (name.startsWith("#"))
      return codePoint(
        name.toLowerCase().startsWith("#x")
          ? Number.parseInt(name.slice(2), 16)
          : Number(name.slice(1))
      )
    return XML_ENTITIES[name.toLowerCase()] ?? entity
  })
}

function decodeCss(value: string): string {
  return value.replaceAll(
    /\\(?:([\da-f]{1,6})\s?|([\s\S]))/giu,
    (_escape, hex: string | undefined, character: string) =>
      hex == null ? character : codePoint(Number.parseInt(hex, 16))
  )
}

function codePoint(value: number): string {
  return value > 0 && value <= 1_114_111 ? String.fromCodePoint(value) : "�"
}

function rejectResource(): never {
  throw new Error("[ardo] Share image templates must be self-contained SVG with embedded images.")
}
