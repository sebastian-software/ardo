export function parseHighlightLines(meta: string): number[] {
  const match = /\{([\d,-]+)\}/u.exec(meta)
  if (match?.[1] == null) {
    return []
  }

  const lines: number[] = []
  for (const range of match[1].split(",")) {
    appendRangeLines(lines, range)
  }

  return lines
}

function appendRangeLines(lines: number[], range: string): void {
  if (range.includes("-")) {
    appendRangeSet(lines, range)
    return
  }

  const lineNumber = Number(range)
  if (Number.isFinite(lineNumber)) {
    lines.push(lineNumber)
  }
}

function appendRangeSet(lines: number[], range: string): void {
  const [start, end] = range.split("-").map(Number)
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return
  }

  for (let line = start; line <= end; line++) {
    lines.push(line)
  }
}

export function parseTitle(meta: string): string | undefined {
  const match = /title="([^"]+)"/u.exec(meta)
  return match?.[1]
}

export function parseLabel(meta: string): string | undefined {
  const start = meta.indexOf("[")
  if (start === -1) {
    return undefined
  }

  const end = meta.indexOf("]", start + 1)
  if (end === -1) {
    return undefined
  }

  const label = meta.slice(start + 1, end).trim()
  return label.length > 0 ? label : undefined
}
