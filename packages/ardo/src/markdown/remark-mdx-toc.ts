/**
 * Remark plugin that extracts headings from MDX and exports them as `toc`.
 *
 * Adds `export const toc = [...]` to the MDX module, similar to how
 * `remark-mdx-frontmatter` exports frontmatter.
 */
import type { Heading, Root } from "mdast"

import { valueToEstree } from "estree-util-value-to-estree"
import { define } from "unist-util-mdx-define"
import { visit } from "unist-util-visit"

import type { TOCItem } from "../config/types"

type RemarkMdxTocOptions = {
  /** Export name (default: "toc") */
  name?: string
  /** Heading levels to include (default: [2, 3]) */
  levels?: [number, number]
}

export function remarkMdxToc(options: RemarkMdxTocOptions = {}) {
  const { name = "toc", levels = [2, 3] } = options
  const [minLevel, maxLevel] = levels

  return function (tree: Root, file: Parameters<typeof define>[1]) {
    const items: TOCItem[] = []
    let headingIndex = 0

    visit(tree, "heading", (node: Heading) => {
      if (node.depth < minLevel || node.depth > maxLevel) return

      const text = getHeadingText(node)
      const slug = slugify(text)
      const id = slug === "" ? `heading-${String(headingIndex)}` : slug
      headingIndex++

      items.push({ id, text, level: node.depth })

      // Add id to the heading node for anchor links
      const hProperties = ensureHProperties(node)
      hProperties.id = id
    })

    // Use the same approach as remark-mdx-frontmatter: valueToEstree + define
    define(tree, file, { [name]: valueToEstree(items) })
  }
}

function getHeadingText(node: Heading): string {
  const parts: string[] = []

  function extract(child: unknown) {
    if (!isRecord(child)) return

    if (child.type === "text" || child.type === "inlineCode") {
      parts.push(typeof child.value === "string" ? child.value : "")
    } else if (Array.isArray(child.children)) {
      for (const nested of child.children) extract(nested)
    }
  }

  for (const child of node.children) extract(child)
  return parts.join("")
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

  return slug.replaceAll(/^-|-$/g, "")
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
