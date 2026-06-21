/**
 * Remark plugin that mirrors recognised frontmatter fields onto the
 * React Router `handle` export, so the layout decision becomes part of
 * the route module the same way it would in a hand-written `.tsx` route.
 *
 * Currently supported field: `layout`.
 *
 * Input:
 *
 *     ---
 *     title: Welcome
 *     layout: bare
 *     ---
 *
 * Effective output (added to the MDX module):
 *
 *     export const handle = { layout: "bare" }
 *
 * The recognised layout values are `"bare"` (chrome-less marketing/home
 * page) and `"default"` (no-op, equivalent to omitting the field).
 */
import type { Root, Yaml } from "mdast"

import { valueToEstree } from "estree-util-value-to-estree"
import { define } from "unist-util-mdx-define"

type RouteHandle = {
  layout?: "bare" | "default"
}

export function remarkMdxHandle() {
  return function (tree: Root, file: Parameters<typeof define>[1]) {
    const yamlNode = tree.children.find((node): node is Yaml => node.type === "yaml")
    if (yamlNode === undefined) return

    const layout = extractLayoutValue(yamlNode.value)
    if (layout === undefined) return

    const handle: RouteHandle = { layout }
    define(tree, file, { handle: valueToEstree(handle) })
  }
}

function extractLayoutValue(yaml: string): RouteHandle["layout"] | undefined {
  const match = /^layout:[ \t]+(\S.*)$/m.exec(yaml)
  if (match === null) return undefined
  const raw = match[1].trim().replaceAll(/^["']|["']$/g, "")
  if (raw === "bare" || raw === "default") return raw
  return undefined
}
