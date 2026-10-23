/** Markdown building blocks for generated API pages. */

/** Page URL of every documented declaration, by name. */
export type Links = Map<string, string>

/** Name, type, required and description rows; drops the description column when every cell is empty. */
export function memberTable(rows: string[][]): string[] {
  const described = rows.some((row) => row[3] !== "")
  const headers = described
    ? ["Name", "Type", "Required", "Description"]
    : ["Name", "Type", "Required"]
  return [
    tableRow(headers),
    tableRow(headers.map(() => "---")),
    ...rows.map((row) => tableRow(row.slice(0, headers.length).map((value) => cell(value)))),
  ]
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`
}

/**
 * JSDoc prose that mentions a tag, such as "renders a <div>", would become JSX
 * in the generated page and break the build. Outside code, `<` before a tag
 * name becomes an entity, so the text still reads `<div>`. Autolinks stay.
 */
export function escapeTags(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/u)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replaceAll(/<(?=[!/A-Za-z])(?!https?:|mailto:)/gu, "&lt;")
    )
    .join("")
}

/**
 * A type for a table cell or a returns line: on one line, without the
 * `import("…")` qualifiers of emitted declarations, and with every
 * documented type name linked to its page.
 */
export function typeCode(type: string, links: Links): string {
  const text = compactType(type)
  const segments: string[] = []
  let last = 0
  let linked = false
  for (const match of text.matchAll(/(?<![\w$."'`])[A-Z][\w$]*/gu)) {
    const url = links.get(match[0])
    if (url == null) continue
    segments.push(...codeSegment(text.slice(last, match.index)))
    segments.push(`[${inlineCode(match[0])}](${url})`)
    last = match.index + match[0].length
    linked = true
  }
  if (!linked) return inlineCode(text)
  segments.push(...codeSegment(text.slice(last)))
  return segments.join("")
}

/** Code for the text between links, keeping the spaces around it outside the code span. */
function codeSegment(value: string): string[] {
  if (value === "") return []
  const core = value.trim()
  if (core === "") return [" "]
  return [`${/^\s/u.test(value) ? " " : ""}${inlineCode(core)}${/\s$/u.test(value) ? " " : ""}`]
}

function compactType(type: string): string {
  return displayCode(type)
    .replaceAll(/\/\*[\s\S]*?\*\//gu, " ")
    .replaceAll(/\s+/gu, " ")
    .replaceAll(/;\s*\}/gu, " }")
    .trim()
}

/** Emitted declarations qualify imported types as `import("react").JSX.Element`. */
export function displayCode(value: string): string {
  return value.replaceAll(/import\(\s*["'][^"']+["']\s*\)\./gu, "")
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll(/\r?\n/gu, "<br />")
}

export function inlineCode(value: string): string {
  const fence = "`".repeat(
    Math.max(0, ...[...value.matchAll(/`+/gu)].map((match) => match[0].length)) + 1
  )
  return `${fence} ${value} ${fence}`
}

export function codeBlock(value: string, language = "ts"): string {
  const fence = "`".repeat(
    Math.max(2, ...[...value.matchAll(/`+/gu)].map((match) => match[0].length)) + 1
  )
  return `${fence}${language}\n${value}\n${fence}`
}
