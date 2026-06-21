/**
 * Remark plugin that turns GitHub-flavored alert blockquotes into Ardo
 * callout components.
 *
 * Input (GFM alert syntax):
 *
 *     > [!NOTE]
 *     > Useful information that users should know.
 *
 * Output (after this plugin, MDX equivalent):
 *
 *     <Note>
 *       Useful information that users should know.
 *     </Note>
 *
 * Supported types and their mapping:
 *
 * - `[!NOTE]` → `Note`
 * - `[!TIP]` → `Tip`
 * - `[!IMPORTANT]` → `Info`
 * - `[!WARNING]` → `Warning`
 * - `[!CAUTION]` → `Danger`
 */
import type { Blockquote, PhrasingContent, Root, RootContent } from "mdast"

import { visit } from "unist-util-visit"

type MdxJsxFlowElement = {
  type: "mdxJsxFlowElement"
  name: string
  attributes: never[]
  children: RootContent[]
}

const TYPE_MAP: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Info",
  WARNING: "Warning",
  CAUTION: "Danger",
}

const ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n?/i

export function remarkCallouts() {
  return function (tree: Root) {
    visit(tree, "blockquote", (node: Blockquote, index, parent) => {
      if (parent == null || index == null) return

      const componentName = extractCalloutType(node)
      if (componentName == null) return

      const replacement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: componentName,
        attributes: [],
        children: node.children,
      }

      // Replace the blockquote node with the JSX element.
      // mdxJsxFlowElement is not part of the base mdast Root["children"]
      // union, but @mdx-js/mdx adds it via the mdxjs preset.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      parent.children[index] = replacement as unknown as RootContent
    })
  }
}

function extractCalloutType(node: Blockquote): string | undefined {
  // Runtime guards for empty arrays — TS types treat indexed access as
  // non-undefined here, but a blockquote can legitimately have no children
  // or an empty paragraph during streaming parsers.
  const firstChild = node.children[0] as Blockquote["children"][number] | undefined
  if (firstChild?.type !== "paragraph") return undefined

  const firstParaChild = firstChild.children[0] as (typeof firstChild.children)[number] | undefined
  if (firstParaChild?.type !== "text") return undefined

  const match = ALERT_REGEX.exec(firstParaChild.value)
  if (match === null) return undefined

  const calloutName = TYPE_MAP[match[1].toUpperCase()]

  // Strip the `[!TYPE]` marker (and its trailing whitespace/newline) from
  // the first text node.
  firstParaChild.value = firstParaChild.value.slice(match[0].length)

  // If the marker consumed the entire first text node, drop the empty text
  // node and any leading break that immediately followed it.
  if (firstParaChild.value === "") {
    firstChild.children.shift()
    stripLeadingBreak(firstChild.children)
  }

  // If the first paragraph is now empty, drop it.
  if (firstChild.children.length === 0) {
    node.children.shift()
  }

  return calloutName
}

function stripLeadingBreak(children: PhrasingContent[]) {
  if (children[0]?.type === "break") {
    children.shift()
  }
}
