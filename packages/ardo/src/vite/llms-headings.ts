import { prepareDocument } from "ferromark"

/**
 * Moves every Markdown heading `offset` levels deeper, up to `######`.
 * `llms-full.txt` gives each page a `##` title, so a page's own sections
 * start at `###` and a reader can tell where the next page begins.
 *
 * Ferromark finds the headings, so code fences, HTML blocks, and setext
 * headings keep their meaning. Its spans count UTF-8 bytes.
 */
export function shiftHeadings(markdown: string, offset: number): string {
  const source = Buffer.from(markdown)
  const parts: Buffer[] = []
  let position = 0
  for (const heading of prepareDocument(markdown, { format: "md" }).metadata.outline) {
    const level = Math.min(6, heading.level + offset)
    if (level === heading.level) continue
    const text = source.subarray(heading.start, heading.end).toString()
    parts.push(source.subarray(position, heading.start), Buffer.from(rewriteHeading(text, level)))
    position = heading.end
  }
  parts.push(source.subarray(position))
  return Buffer.concat(parts).toString()
}

function rewriteHeading(text: string, level: number): string {
  const atx = /^( {0,3})#{1,6}(?=[\t ]|\r?\n|$)/u.exec(text)
  if (atx != null) return `${atx[1]}${"#".repeat(level)}${text.slice(atx[0].length)}`
  // A setext heading is its text lines plus a === or --- underline. ATX needs one line.
  const lines = text.replace(/\r?\n$/u, "").split(/\r?\n/u)
  const content = lines
    .slice(0, -1)
    .map((line) => line.trim())
    .join(" ")
  return `${"#".repeat(level)} ${content}${text.endsWith("\n") ? "\n" : ""}`
}
