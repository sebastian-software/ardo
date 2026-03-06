import type { Heading, Root } from "mdast"

import { visit } from "unist-util-visit"

import type { TOCItem } from "../config/types"

export interface TocExtraction {
  toc: TOCItem[]
}

interface TocOptions {
  tocExtraction: TocExtraction
  levels: [number, number]
}

export function remarkExtractToc(options: TocOptions) {
  const { tocExtraction, levels } = options
  const [minLevel, maxLevel] = levels

  return function (tree: Root) {
    const headings: Array<{ text: string; level: number; id: string }> = []
    let headingIndex = 0

    visit(tree, "heading", (node: Heading) => {
      if (node.depth < minLevel || node.depth > maxLevel) {
        return
      }

      const text = getHeadingText(node)
      const slug = slugify(text)
      const id = slug === "" ? `heading-${headingIndex}` : slug
      headingIndex++

      headings.push({
        text,
        level: node.depth,
        id,
      })

      // Add id to the heading node for anchor links
      const data = node.data ?? (node.data = {})
      const hProperties = (data.hProperties ?? (data.hProperties = {})) as Record<string, string>
      hProperties.id = id
    })

    tocExtraction.toc = buildTocTree(headings)
  }
}

function getHeadingText(node: Heading): string {
  const textParts: string[] = []

  function extractText(child: unknown) {
    if (typeof child !== "object" || child === null) return

    const typedChild = child as { type?: string; value?: string; children?: unknown[] }

    if (typedChild.type === "text") {
      textParts.push(typedChild.value ?? "")
    } else if (typedChild.type === "inlineCode") {
      textParts.push(typedChild.value ?? "")
    } else if (Array.isArray(typedChild.children)) {
      typedChild.children.forEach((nestedChild) => {
        extractText(nestedChild)
      })
    }
  }

  node.children.forEach((child) => {
    extractText(child)
  })
  return textParts.join("")
}

function slugify(text: string): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\s\w-]/g, "")
    .replaceAll(/[\s_]/g, "-")

  while (slug.includes("--")) {
    slug = slug.replaceAll("--", "-")
  }

  if (slug.startsWith("-")) {
    slug = slug.slice(1)
  }

  if (slug.endsWith("-")) {
    slug = slug.slice(0, -1)
  }

  return slug
}

function popStackUntilParent(stack: Array<{ item: TOCItem; level: number }>, level: number): void {
  while (stack.length > 0) {
    const last = stack.at(-1)
    if (last === undefined || last.level < level) break
    stack.pop()
  }
}

function insertIntoTree(
  result: TOCItem[],
  stack: Array<{ item: TOCItem; level: number }>,
  item: TOCItem
): void {
  const parent = stack.at(-1)?.item
  if (parent === undefined) {
    result.push(item)
  } else {
    parent.children ??= []
    parent.children.push(item)
  }
}

function buildTocTree(headings: Array<{ text: string; level: number; id: string }>): TOCItem[] {
  const result: TOCItem[] = []
  const stack: Array<{ item: TOCItem; level: number }> = []

  for (const heading of headings) {
    const item: TOCItem = { id: heading.id, text: heading.text, level: heading.level }
    popStackUntilParent(stack, heading.level)
    insertIntoTree(result, stack, item)
    stack.push({ item, level: heading.level })
  }

  return result
}

export function flattenToc(toc: TOCItem[]): TOCItem[] {
  const result: TOCItem[] = []

  function flatten(items: TOCItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.children !== undefined) {
        flatten(item.children)
      }
    }
  }

  flatten(toc)
  return result
}
