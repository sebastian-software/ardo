import type { TOCItem } from "../config/types"
import type { NativeMarkdownHeading } from "./native-metadata"

/** Build a nested table of contents from Ferromark's heading identities. */
export function buildToc(
  headings: readonly NativeMarkdownHeading[],
  levels: [number, number] = [2, 3]
): TOCItem[] {
  const [minLevel, maxLevel] = levels
  const result: TOCItem[] = []
  const stack: Array<{ item: TOCItem; level: number }> = []

  for (const heading of headings) {
    if (heading.id == null || heading.level < minLevel || heading.level > maxLevel) continue

    while (stack.length > 0 && (stack.at(-1)?.level ?? 0) >= heading.level) {
      stack.pop()
    }

    const item: TOCItem = { id: heading.id, level: heading.level, text: heading.text }
    const parent = stack.at(-1)?.item
    if (parent == null) {
      result.push(item)
    } else {
      parent.children ??= []
      parent.children.push(item)
    }
    stack.push({ item, level: heading.level })
  }

  return result
}

export function flattenToc(toc: TOCItem[]): TOCItem[] {
  const result: TOCItem[] = []

  function flatten(items: TOCItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.children !== undefined) flatten(item.children)
    }
  }

  flatten(toc)
  return result
}
