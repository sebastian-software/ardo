import type { TOCItem } from "../config/types"
import type { NativeMarkdownHeading } from "./native-metadata"

/** Whether a page's `outline` frontmatter is valid: a boolean, a heading level, or a level range. */
export function isOutlineSetting(value: unknown): value is [number, number] | boolean | number {
  if (typeof value === "boolean" || isHeadingLevel(value)) return true
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isHeadingLevel(value[0]) &&
    isHeadingLevel(value[1]) &&
    value[0] <= value[1]
  )
}

/**
 * The heading levels a page's outline lists. A number lists only that level, `[min, max]` that
 * range; anything else keeps the site's `markdown.toc.level`.
 */
export function resolveTocLevels(
  outline: unknown,
  siteLevels: [number, number] = [2, 3]
): [number, number] {
  if (isHeadingLevel(outline)) return [outline, outline]
  if (Array.isArray(outline) && isOutlineSetting(outline)) return [outline[0], outline[1]]
  // `true` and `false` keep the site's levels; `false` hides the outline in the page layout.
  return siteLevels
}

function isHeadingLevel(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6
}

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
