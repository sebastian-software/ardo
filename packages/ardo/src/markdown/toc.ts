import type { Heading, Root } from "mdast"

import { visit } from "unist-util-visit"

import type { TOCItem } from "../config/types"

import { createHeadingSlugger } from "./heading-slug"

export type TocExtraction = {
  toc: TOCItem[]
}

type TocOptions = {
  anchor?: boolean
  tocExtraction: TocExtraction
  levels: [number, number]
}

export function remarkExtractToc(options: TocOptions) {
  const { anchor = true, tocExtraction, levels } = options
  const [minLevel, maxLevel] = levels

  return function (tree: Root) {
    const headings: Array<{ text: string; level: number; id: string }> = []
    const slugger = createHeadingSlugger()

    visit(tree, "heading", (node: Heading) => {
      if (node.depth < minLevel || node.depth > maxLevel) {
        return
      }

      const text = getHeadingText(node)
      const id = slugger.slug(text)

      headings.push({
        text,
        level: node.depth,
        id,
      })

      if (anchor) {
        // Add id to the heading node for anchor links
        const hProperties = ensureHProperties(node)
        hProperties.id = id
      }
    })

    tocExtraction.toc = buildTocTree(headings)
  }
}

function getHeadingText(node: Heading): string {
  const textParts: string[] = []

  function extractText(child: unknown) {
    if (!isRecord(child)) return

    if (child.type === "text") {
      textParts.push(typeof child.value === "string" ? child.value : "")
    } else if (child.type === "inlineCode") {
      textParts.push(typeof child.value === "string" ? child.value : "")
    } else if (Array.isArray(child.children)) {
      child.children.forEach((nestedChild) => {
        extractText(nestedChild)
      })
    }
  }

  node.children.forEach((child) => {
    extractText(child)
  })
  return textParts.join("")
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

type HeadingDataWithHProperties = {
  hProperties?: Record<string, unknown>
} & Heading["data"]

function ensureHProperties(node: Heading): Record<string, unknown> {
  const data: HeadingDataWithHProperties = node.data ?? {}
  node.data = data

  if (!isRecord(data.hProperties)) {
    data.hProperties = {}
  }

  return data.hProperties
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
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
