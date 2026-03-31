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

interface RemarkMdxTocOptions {
  /** Export name (default: "toc") */
  name?: string
  /** Heading levels to include (default: [2, 3]) */
  levels?: [number, number]
}

export function remarkMdxToc(options: RemarkMdxTocOptions = {}) {
  const { name = "toc", levels = [2, 3] } = options
  const [minLevel, maxLevel] = levels

  return function (tree: Root, file: unknown) {
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
      const data = node.data ?? (node.data = {})
      const hProperties = (data.hProperties ?? (data.hProperties = {})) as Record<string, string>
      hProperties.id = id
    })

    // Use the same approach as remark-mdx-frontmatter: valueToEstree + define
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    define(tree, file as any, { [name]: valueToEstree(items) })
  }
}

function getHeadingText(node: Heading): string {
  const parts: string[] = []

  function extract(child: unknown) {
    if (typeof child !== "object" || child === null) return
    const typed = child as { type?: string; value?: string; children?: unknown[] }
    if (typed.type === "text" || typed.type === "inlineCode") {
      parts.push(typed.value ?? "")
    } else if (Array.isArray(typed.children)) {
      for (const nested of typed.children) extract(nested)
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
