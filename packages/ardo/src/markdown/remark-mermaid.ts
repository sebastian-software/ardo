/**
 * Remark plugin that turns Mermaid code fences into the ArdoMermaid
 * component.
 *
 * Input:
 *
 *     ```mermaid
 *     graph TD
 *       A --> B
 *     ```
 *
 * Output (after this plugin, MDX equivalent):
 *
 *     import { ArdoMermaid as __ArdoMermaid } from "ardo/ui"
 *
 *     <__ArdoMermaid code="graph TD\n  A --> B" />
 *
 * The import is only injected into documents that actually contain a
 * Mermaid fence, so pages (and sites) without diagrams never reference
 * the optional `mermaid` dependency.
 */
import type { Code, Root, RootContent } from "mdast"

import { visit } from "unist-util-visit"

const COMPONENT_NAME = "__ArdoMermaid"

type MdxJsxAttribute = {
  type: "mdxJsxAttribute"
  name: string
  value: string
}

type MdxJsxFlowElement = {
  type: "mdxJsxFlowElement"
  name: string
  attributes: MdxJsxAttribute[]
  children: never[]
}

function createMermaidElement(code: string): MdxJsxFlowElement {
  return {
    type: "mdxJsxFlowElement",
    name: COMPONENT_NAME,
    attributes: [{ type: "mdxJsxAttribute", name: "code", value: code }],
    children: [],
  }
}

function createMermaidImport() {
  return {
    type: "mdxjsEsm",
    value: `import { ArdoMermaid as ${COMPONENT_NAME} } from "ardo/ui"`,
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ImportDeclaration",
            specifiers: [
              {
                type: "ImportSpecifier",
                imported: { type: "Identifier", name: "ArdoMermaid" },
                local: { type: "Identifier", name: COMPONENT_NAME },
              },
            ],
            source: { type: "Literal", value: "ardo/ui", raw: '"ardo/ui"' },
            attributes: [],
          },
        ],
      },
    },
  }
}

export function remarkMermaid() {
  return function (tree: Root) {
    const replacements: MdxJsxFlowElement[] = []

    visit(tree, "code", (node: Code, index, parent) => {
      if (parent == null || index == null || node.lang !== "mermaid") return

      const element = createMermaidElement(node.value)
      replacements.push(element)
      // mdxJsxFlowElement is not part of the base mdast content union,
      // but @mdx-js/mdx adds it via the mdxjs preset.
      parent.children[index] = element
    })

    if (replacements.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      tree.children.unshift(createMermaidImport() as unknown as RootContent)
    }
  }
}
