export type MarkdownFenceMarker = "`" | "~"

export function getMarkdownFenceMarker(line: string): MarkdownFenceMarker | null {
  const trimmed = line.trimStart()
  if (/^`{3,}/u.test(trimmed)) return "`"
  if (/^~{3,}/u.test(trimmed)) return "~"
  return null
}
